import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../server/app.js';
import { validateHistory } from '../server/n8n.js';

const HOOK = 'https://n8n.test/webhook/hiremeow-career';
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://sb.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  N8N_WEBHOOK_URL: HOOK, N8N_WEBHOOK_KEY: 'secret-key'
};
const STUDENT = { id: '11111111-1111-4111-8111-111111111111', email: 's@test' };

function backend(reply) {
  const sent = [];
  const f = async (url, opts = {}) => {
    const u = new URL(url);
    if (u.hostname === 'sb.test' && u.pathname === '/auth/v1/user') {
      return (opts.headers?.Authorization || '') === 'Bearer tok' ? Response.json(STUDENT) : Response.json({}, { status: 401 });
    }
    if (u.hostname === 'sb.test' && u.pathname === '/rest/v1/profiles') return Response.json([{ id: STUDENT.id, role: 'student' }]);
    if (url === HOOK) { sent.push({ headers: opts.headers, body: JSON.parse(opts.body) }); return typeof reply === 'function' ? reply() : reply; }
    throw new Error('unexpected call ' + url);
  };
  return { f, sent };
}

const post = (env, f, body, token = 'tok') => handle(new Request('https://hiremeow.test/api/visa', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://hiremeow.test', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  body: JSON.stringify(body)
}), env, { fetch: f });

test('a visa question reaches n8n with the secret header and returns the answer', async () => {
  const { f, sent } = backend(Response.json({ ok: true, task: 'visa', message: 'A Non-B visa needs a job offer.' }));
  const res = await post(ENV, f, { message: 'Do I need a Non-B visa?', history: [{ role: 'user', content: 'hi' }] });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { text: 'A Non-B visa needs a job offer.', source: 'n8n' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].headers['X-HireMeow-Key'], 'secret-key');
  assert.equal(sent[0].body.task, 'visa');
  assert.deepEqual(sent[0].body.history, [{ role: 'user', content: 'hi' }]);
});

test('the endpoint needs a signed-in user', async () => {
  const { f, sent } = backend(Response.json({ ok: true, message: 'x' }));
  const res = await post(ENV, f, { message: 'visa?' }, '');
  assert.equal(res.status, 401);
  assert.equal(sent.length, 0);
});

test('it reports not connected when the webhook is not configured', async () => {
  const { f } = backend(Response.json({ ok: true, message: 'x' }));
  const res = await post({ ...ENV, N8N_WEBHOOK_URL: '', N8N_WEBHOOK_KEY: '' }, f, { message: 'visa?' });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).code, 'not_configured');
});

test('an AI_UNAVAILABLE reply is passed on as 503', async () => {
  const { f } = backend(Response.json({ ok: false, code: 'AI_UNAVAILABLE', message: 'Model is down.' }, { status: 503 }));
  const res = await post(ENV, f, { message: 'visa?' });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.code, 'ai_unavailable');
  assert.equal(body.error, 'Model is down.');
});

test('a rejected secret becomes a 503, not a 401 the user sees as sign-in', async () => {
  const { f } = backend(new Response('Authorization data is wrong!', { status: 403 }));
  const res = await post(ENV, f, { message: 'visa?' });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).code, 'not_configured');
});

test('an empty answer is an error, never a blank reply', async () => {
  const { f } = backend(Response.json({ ok: true, message: '   ' }));
  const res = await post(ENV, f, { message: 'visa?' });
  assert.equal(res.status, 502);
  assert.equal((await res.json()).code, 'empty_completion');
});

test('an empty question is rejected before any call goes out', async () => {
  const { f, sent } = backend(Response.json({ ok: true, message: 'x' }));
  const res = await post(ENV, f, { message: '   ' });
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);
});

test('history is trimmed to the last 8 messages and validated', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ role: 'user', content: 'm' + i }));
  assert.equal(validateHistory(many).length, 8);
  assert.deepEqual(validateHistory(undefined), []);
  assert.throws(() => validateHistory([{ role: 'system', content: 'x' }]), /role and text/);
});

test('status says whether the workflow is connected', async () => {
  const { f } = backend(Response.json({ ok: true, message: 'x' }));
  const res = await handle(new Request('https://hiremeow.test/api/visa/status', { headers: { Authorization: 'Bearer tok' } }), ENV, { fetch: f });
  assert.deepEqual(await res.json(), { available: true, signInRequired: false });
  const off = await handle(new Request('https://hiremeow.test/api/visa/status'), { ...ENV, N8N_WEBHOOK_URL: '' }, { fetch: f });
  assert.deepEqual(await off.json(), { available: false, signInRequired: false });
});
