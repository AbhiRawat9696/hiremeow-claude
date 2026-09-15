import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../server/app.js';
import { signForTest, verifyStripeEvent } from '../server/stripe.js';
import { healthFromNews, classify } from '../server/news/index.js';
import { fetchMockNews } from '../server/news/mock-news.js';
import { validateTurns } from '../server/ai.js';
import { stopsBetween, STATIONS, haversineKm } from '../public/assets/platform/stations.js';

const ENV = { NEXT_PUBLIC_SUPABASE_URL: 'https://sb.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_KEY: 'service-key',
  STRIPE_SECRET_KEY: 'sk_test_123', STRIPE_WEBHOOK_SECRET: 'whsec_test', CRON_SECRET: 'cron-secret', OPENAI_API_KEY: 'oa-key' };
const USERS = { 'tok-company': { id: 'u-co', email: 'boss@co.test', role: 'company' }, 'tok-student': { id: 'u-stu', email: 's@test', role: 'student' }, 'tok-admin': { id: 'u-adm', email: 'a@test', role: 'admin' } };

// Fake Supabase + Stripe + OpenAI backend that records calls.
function backend() {
  const calls = [];
  const f = async (url, opts = {}) => {
    const u = new URL(url); const auth = opts.headers?.Authorization || '';
    calls.push({ url: u.pathname + u.search, method: opts.method || 'GET', auth, apikey: opts.headers?.apikey, body: opts.body });
    if (u.pathname === '/auth/v1/user') { const user = USERS[auth.replace('Bearer ', '')]; return user ? Response.json(user) : Response.json({ msg: 'bad jwt' }, { status: 401 }); }
    if (u.pathname === '/rest/v1/profiles') { const id = u.searchParams.get('id').replace('eq.', ''); const user = Object.values(USERS).find(x => x.id === id); return Response.json(user ? [{ id, role: user.role, full_name: 'X' }] : []); }
    if (u.pathname === '/rest/v1/companies' && (opts.method || 'GET') === 'GET') return u.searchParams.get('owner_id') ? Response.json([{ id: 'co-1', name: 'Siam Pixel' }]) : Response.json([{ id: 'co-1', name: 'Siam Pixel', health_locked: false }, { id: 'co-2', name: 'Krungthep Coffee', health_locked: false }]);
    if (u.pathname === '/rest/v1/companies') return Response.json([{}]);
    if (u.pathname === '/rest/v1/meow_pool_access' && (opts.method || 'GET') === 'GET') return Response.json([]);
    if (u.pathname.startsWith('/rest/v1/')) return new Response(null, { status: 201 });
    if (u.pathname === '/rest/v1/rpc/hm_run_ghosting_check') return Response.json([]);
    if (u.pathname === '/v1/checkout/sessions') return Response.json({ id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc' });
    if (u.pathname.startsWith('/v1/checkout/sessions/')) return Response.json({ id: 'cs_test_abc', payment_status: 'paid', amount_total: 300000, metadata: { product: 'meow_pool', company_id: 'co-1', month: '2026-09-01', user_id: 'u-co' } });
    if (u.hostname === 'api.openai.com') return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"score":70}' }] }] });
    return Response.json({ error: 'unexpected ' + url }, { status: 500 });
  };
  return { f, calls };
}
const req = (path, { method = 'GET', token, body, headers = {} } = {}) => new Request('https://hm.test' + path, {
  method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json', Origin: 'https://hm.test' } : {}), ...headers },
  ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
const quiet = () => {};

test('config exposes only public keys', async () => {
  const res = await handle(req('/api/config'), ENV, { fetch: backend().f });
  const data = await res.json();
  assert.equal(data.supabaseAnonKey, 'anon-key');
  assert.ok(!JSON.stringify(data).includes('service-key') && !JSON.stringify(data).includes('sk_test') && !JSON.stringify(data).includes('oa-key'));
  assert.equal(data.features.platform, true);
  const off = await (await handle(req('/api/config'), {}, {})).json();
  assert.equal(off.features.platform, false);
});

test('unknown API routes 404, non-API returns null', async () => {
  assert.equal((await handle(req('/api/nope'), ENV, {})).status, 404);
  assert.equal(await handle(req('/index.html'), ENV, {}), null);
});

test('chat ignores spoofed platform identity and uses the Supabase user', async () => {
  const b = backend();
  const spoof = await handle(req('/api/chat/status', { headers: { 'oai-authenticated-user-id': 'attacker' } }), ENV, { fetch: b.f });
  const s = await spoof.json();
  assert.equal(s.available, false); assert.equal(s.signInRequired, true);
  const ok = await (await handle(req('/api/chat/status', { token: 'tok-student' }), ENV, { fetch: b.f })).json();
  assert.equal(ok.available, true);
  const post = await handle(req('/api/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'hi' }], webSearch: false }, headers: { 'oai-authenticated-user-id': 'attacker' } }), ENV, { fetch: b.f });
  assert.equal(post.status, 401);
});

test('AI endpoint requires sign-in, validates turns, returns text', async () => {
  const b = backend();
  assert.equal((await handle(req('/api/ai', { method: 'POST', body: { messages: [{ role: 'user', content: 'x' }] } }), ENV, { fetch: b.f })).status, 401);
  const res = await handle(req('/api/ai', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'Roast' }], format: 'json' } }), ENV, { fetch: b.f });
  assert.equal(res.status, 200); assert.equal((await res.json()).text, '{"score":70}');
  const sent = JSON.parse(b.calls.find(c => c.url.startsWith('/v1/responses')).body);
  assert.equal(sent.store, false); assert.equal(sent.text.format.type, 'json_object');
  assert.throws(() => validateTurns([{ role: 'assistant', content: 'x' }]));
  assert.throws(() => validateTurns([{ role: 'system', content: 'x' }]));
  const cross = await handle(new Request('https://hm.test/api/ai', { method: 'POST', headers: { Origin: 'https://evil.test', Authorization: 'Bearer tok-student' }, body: '{}' }), ENV, { fetch: b.f });
  assert.equal(cross.status, 403);
});

test('Stripe checkout: company only, test key only, THB 3000', async () => {
  const b = backend();
  assert.equal((await handle(req('/api/stripe/checkout', { method: 'POST', token: 'tok-student', body: {} }), ENV, { fetch: b.f })).status, 403);
  const res = await handle(req('/api/stripe/checkout', { method: 'POST', token: 'tok-company', body: {} }), ENV, { fetch: b.f });
  assert.equal((await res.json()).url, 'https://checkout.stripe.com/c/pay/cs_test_abc');
  const form = new URLSearchParams(b.calls.find(c => c.url === '/v1/checkout/sessions').body);
  assert.equal(form.get('line_items[0][price_data][currency]'), 'thb');
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '300000');
  assert.equal(form.get('metadata[company_id]'), 'co-1');
  const live = await handle(req('/api/stripe/checkout', { method: 'POST', token: 'tok-company', body: {} }), { ...ENV, STRIPE_SECRET_KEY: 'sk_live_x' }, { fetch: b.f });
  assert.equal(live.status, 503);
});

test('Stripe webhook verifies signature and grants pool access with the service key', async () => {
  const b = backend();
  const event = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_abc', payment_status: 'paid', amount_total: 300000, metadata: { product: 'meow_pool', company_id: 'co-1', month: '2026-09-01' } } } });
  const bad = await handle(req('/api/stripe/webhook', { method: 'POST', body: event, headers: { 'stripe-signature': 't=1,v1=00' } }), ENV, { fetch: b.f, log: quiet });
  assert.equal(bad.status, 400);
  const good = await handle(req('/api/stripe/webhook', { method: 'POST', body: event, headers: { 'stripe-signature': signForTest(event, 'whsec_test') } }), ENV, { fetch: b.f });
  assert.equal((await good.json()).granted, true);
  const insert = b.calls.find(c => c.url.startsWith('/rest/v1/meow_pool_access') && c.method === 'POST');
  assert.equal(insert.auth, 'Bearer service-key');
  assert.deepEqual(JSON.parse(insert.body)[0], { company_id: 'co-1', month: '2026-09-01', stripe_session_id: 'cs_test_abc', amount_thb: 3000 });
  assert.throws(() => verifyStripeEvent(event, signForTest(event, 'whsec_test', 1000), 'whsec_test'), /too old/);
});

test('Stripe confirm only for the paying user', async () => {
  const b = backend();
  const other = await handle(req('/api/stripe/confirm', { method: 'POST', token: 'tok-student', body: { session_id: 'cs_test_abc' } }), ENV, { fetch: b.f });
  assert.equal(other.status, 403);
  const mine = await handle(req('/api/stripe/confirm', { method: 'POST', token: 'tok-company', body: { session_id: 'cs_test_abc' } }), ENV, { fetch: b.f });
  assert.equal((await mine.json()).granted, true);
});

test('cron endpoints need CRON_SECRET or an admin', async () => {
  const b = backend();
  assert.equal((await handle(req('/api/cron/ghosting'), ENV, { fetch: b.f })).status, 401);
  assert.equal((await handle(req('/api/cron/ghosting', { token: 'tok-company' }), ENV, { fetch: b.f })).status, 403);
  const ok = await handle(req('/api/cron/ghosting', { token: 'cron-secret' }), ENV, { fetch: b.f, log: quiet });
  const data = await ok.json();
  assert.equal(data.ok, true); assert.equal(data.mode, 'mock'); assert.equal(data.days, 5);
  const rpc = b.calls.find(c => c.url === '/rest/v1/rpc/hm_run_ghosting_check');
  assert.equal(rpc.auth, 'Bearer service-key'); assert.deepEqual(JSON.parse(rpc.body), { p_days: 5 });
  const admin = await handle(req('/api/cron/company-health', { token: 'tok-admin' }), ENV, { fetch: b.f, log: quiet });
  const health = await admin.json();
  assert.equal(health.checked, 2); assert.equal(health.errors, 0);
  assert.equal(b.calls.filter(c => c.url.startsWith('/rest/v1/companies?id=eq.') && c.method === 'PATCH').length, 2);
});

test('Layoff Radar classification', async () => {
  assert.equal(classify('Acme announces layoffs'), 'negative');
  assert.equal(classify('Acme raises Series A funding'), 'positive');
  assert.equal(healthFromNews([{ sentiment: 'negative', headline: 'a' }, { sentiment: 'negative', headline: 'b' }]).health, 'red');
  assert.equal(healthFromNews([{ sentiment: 'negative', headline: 'a' }, { sentiment: 'positive', headline: 'b' }]).health, 'yellow');
  assert.equal(healthFromNews([{ sentiment: 'neutral', headline: 'a' }]).health, 'green');
  const n1 = await fetchMockNews({ name: 'Acme' }, '2026-09-15'); const n2 = await fetchMockNews({ name: 'Acme' }, '2026-09-15');
  assert.deepEqual(n1.map(x => x.headline), n2.map(x => x.headline));
  assert.ok(n1.every(x => x.headline.endsWith('(mock)')));
});

test('BTS/MRT stop counting', () => {
  assert.equal(stopsBetween('Ari', 'Siam'), 5);
  assert.equal(stopsBetween('Ari', 'Lumphini'), 8);   // via Siam → Sala Daeng ↔ Si Lom
  assert.equal(stopsBetween('Asok', 'Sukhumvit'), 0); // interchange
  assert.equal(stopsBetween('Bang Wa', 'Tao Poon'), 22);
  assert.equal(stopsBetween('Ari', 'Nowhere'), Infinity);
  assert.equal(new Set(STATIONS.map(s => s.id)).size, STATIONS.length);
  assert.ok(Math.abs(haversineKm({ lat: 13.7563, lng: 100.5018 }, { lat: 13.7466, lng: 100.5393 }) - 4.2) < 0.3);
});

test('Vercel router forwards rewritten paths to the API', async () => {
  const { GET, POST } = await import('../api/router.js');
  const saved = { ...process.env };
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await GET(new Request('https://hm.test/api/router?__path=config'));
    assert.equal((await res.json()).features.platform, false);
    const nf = await GET(new Request('https://hm.test/api/router?__path=nope/deeper'));
    assert.equal(nf.status, 404);
    const post = await POST(new Request('https://hm.test/api/router?__path=ai', { method: 'POST', headers: { Origin: 'https://hm.test', 'Content-Type': 'application/json' }, body: '{}' }));
    assert.equal(post.status, 401);
  } finally { process.env = saved; }
});

test('vercel.json wires rewrites, crons and static output', async () => {
  const { readFile } = await import('node:fs/promises');
  const cfg = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(cfg.outputDirectory, 'public');
  assert.ok(cfg.rewrites.some(r => r.destination.startsWith('/api/router')));
  assert.deepEqual(cfg.crons.map(c => c.path).sort(), ['/api/cron/company-health', '/api/cron/ghosting']);
});
