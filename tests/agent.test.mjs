import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../server/app.js';
import { validateProfileChanges, scoreJob } from '../server/agent.js';

const ENV = { NEXT_PUBLIC_SUPABASE_URL: 'https://sb.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_KEY: 'service-key', OPENAI_API_KEY: 'oa-key' };
const STUDENT = { id: '11111111-1111-4111-8111-111111111111', email: 's@test' };
const COMPANY = { id: '22222222-2222-4222-8222-222222222222', email: 'c@test' };
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const JOB2 = '44444444-4444-4444-8444-444444444444';
const APP_ID = '55555555-5555-4555-8555-555555555555';
const PROFILE = { id: STUDENT.id, role: 'student', full_name: 'Aye', skills: ['Python', 'SQL'], preferred_industries: ['Tech'], desired_salary_min: 30000, home_bts_station: 'Asok', visa_type: 'ED Plus', visa_expiry: new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10), pitch_video_id: null };
const JOBS = [
  { id: JOB_ID, title: 'Data Analyst', description: 'Python and SQL dashboards', employment_type: 'full_time', bts_station: 'Phrom Phong', salary_min: 35000, salary_max: 50000, remote_ok: false, companies: { name: 'Siam Data', industry: 'Tech', sponsors_visa: true, company_health: 'green' } },
  { id: JOB2, title: 'Barista', description: 'Coffee', employment_type: 'part_time', bts_station: 'Mo Chit', salary_min: 12000, salary_max: 15000, remote_ok: false, companies: { name: 'Bean', industry: 'Food', sponsors_visa: false, company_health: 'green' } }
];

function backend(openaiSteps) {
  const calls = [];
  const sent = [];
  const f = async (url, opts = {}) => {
    const u = new URL(url);
    calls.push({ url: u.pathname + u.search, method: opts.method || 'GET', body: opts.body, auth: opts.headers?.Authorization });
    if (u.hostname === 'api.openai.com') { const body = JSON.parse(opts.body); sent.push(body); const step = openaiSteps.shift(); return Response.json(typeof step === 'function' ? step(body) : step); }
    const auth = opts.headers?.Authorization || '';
    if (u.pathname === '/auth/v1/user') return auth === 'Bearer tok-student' ? Response.json(STUDENT) : auth === 'Bearer tok-company' ? Response.json(COMPANY) : Response.json({}, { status: 401 });
    if (u.pathname === '/rest/v1/profiles' && (opts.method || 'GET') === 'GET') {
      const id = u.searchParams.get('id').replace('eq.', '');
      if (id === COMPANY.id) return Response.json([{ id, role: 'company' }]);
      return Response.json([PROFILE]);
    }
    if (u.pathname === '/rest/v1/profiles' && opts.method === 'PATCH') return Response.json([{ ...PROFILE, ...JSON.parse(opts.body) }]);
    if (u.pathname === '/rest/v1/jobs') { const id = u.searchParams.get('id'); return Response.json(id ? JOBS.filter(j => 'eq.' + j.id === id) : JOBS); }
    if (u.pathname === '/rest/v1/applications' && (opts.method || 'GET') === 'GET') {
      if (u.searchParams.get('select') === 'job_id,status') return Response.json([{ job_id: JOB2, status: 'applied' }]);
      return Response.json([{ id: APP_ID, status: 'applied', created_at: new Date(Date.now() - 10 * 864e5).toISOString(), updated_at: new Date().toISOString(), jobs: { id: JOB2, title: 'Barista', companies: { name: 'Bean' } } }]);
    }
    if (u.pathname === '/rest/v1/applications' && opts.method === 'POST') return Response.json([{ id: APP_ID }], { status: 201 });
    if (u.pathname === '/rest/v1/applications' && opts.method === 'PATCH') return Response.json([{ id: APP_ID, status: 'withdrawn' }]);
    if (u.pathname === '/rest/v1/offers') return Response.json([]);
    return Response.json({ error: 'unexpected ' + url }, { status: 500 });
  };
  return { f, calls, sent };
}
const req = (path, { method = 'GET', token, body } = {}) => new Request('https://hm.test' + path, {
  method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json', Origin: 'https://hm.test' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}) });
const fcall = (name, args, id = name) => ({ type: 'function_call', call_id: id, name, arguments: JSON.stringify(args) });
const msg = text => ({ output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });

test('agent status reflects sign-in and role', async () => {
  const b = backend([]);
  assert.deepEqual(await (await handle(req('/api/agent/status'), ENV, { fetch: b.f })).json(), { available: false, signInRequired: true, studentOnly: false });
  assert.equal((await (await handle(req('/api/agent/status', { token: 'tok-student' }), ENV, { fetch: b.f })).json()).available, true);
  assert.equal((await (await handle(req('/api/agent/status', { token: 'tok-company' }), ENV, { fetch: b.f })).json()).studentOnly, true);
  assert.equal((await (await handle(req('/api/agent/status', { token: 'tok-student' }), { ...ENV, OPENAI_API_KEY: '' }, { fetch: b.f })).json()).available, false);
});

test('agent requires a student and rejects bad input', async () => {
  const b = backend([]);
  const body = { messages: [{ role: 'user', content: 'find jobs' }] };
  assert.equal((await handle(req('/api/agent', { method: 'POST', body }), ENV, { fetch: b.f })).status, 401);
  assert.equal((await handle(req('/api/agent', { method: 'POST', body, token: 'tok-company' }), ENV, { fetch: b.f })).status, 403);
  assert.equal((await handle(req('/api/agent', { method: 'POST', body: { messages: [{ role: 'system', content: 'x' }] }, token: 'tok-student' }), ENV, { fetch: b.f })).status, 400);
  const cross = await handle(new Request('https://hm.test/api/agent', { method: 'POST', headers: { Origin: 'https://evil.test', Authorization: 'Bearer tok-student' }, body: '{}' }), ENV, { fetch: b.f });
  assert.equal(cross.status, 403);
});

test('agent searches, ranks and prepares an application without sending it', async () => {
  const b = backend([
    { output: [fcall('get_my_profile', {}), fcall('search_jobs', { keywords: 'data' })] },
    body => {
      const out = body.input.filter(i => i.type === 'function_call_output');
      const search = JSON.parse(out.find(o => o.call_id === 'search_jobs').output);
      assert.equal(search.jobs[0].id, JOB_ID);
      assert.ok(search.jobs[0].why.some(r => r.includes('Python')));
      assert.equal(search.jobs[0].stops_from_home, 1);
      return { output: [fcall('propose_application', { job_id: JOB_ID, cover_note: 'I love data.' })] };
    },
    body => {
      const out = JSON.parse(body.input.at(-1).output);
      assert.equal(out.prepared, true); assert.match(out.note, /Confirm/);
      return msg('Found a great match. Press Confirm to apply.');
    }
  ]);
  const res = await handle(req('/api/agent', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'Find me a data job and apply' }] } }), ENV, { fetch: b.f });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.reply, /Confirm/);
  assert.equal(data.proposals.length, 1);
  assert.equal(data.proposals[0].type, 'apply');
  assert.equal(data.proposals[0].args.job_id, JOB_ID);
  assert.equal(data.jobs[0].id, JOB_ID);
  assert.ok(!b.calls.some(c => c.url.startsWith('/rest/v1/applications') && c.method === 'POST'), 'nothing is sent before confirm');
  assert.ok(b.calls.filter(c => c.url.startsWith('/rest/v1/')).every(c => c.auth === 'Bearer tok-student'), 'uses the student token, never the service key');
  assert.equal(b.sent[0].store, false);
  assert.ok(b.sent[0].tools.some(t => t.name === 'propose_application'));
});

test('agent refuses duplicate applications and bad profile fields, and tracks applications', async () => {
  const b = backend([
    { output: [fcall('propose_application', { job_id: JOB2, cover_note: 'x' }, 'a'), fcall('propose_profile_update', { changes: { role: 'admin' } }, 'b'), fcall('list_my_applications', {}, 'c'), fcall('get_job', { job_id: 'nope' }, 'd')] },
    body => {
      const out = Object.fromEntries(body.input.filter(i => i.type === 'function_call_output').map(o => [o.call_id, JSON.parse(o.output)]));
      assert.match(out.a.error, /already applied/);
      assert.match(out.b.error, /can't change "role"/);
      assert.ok(out.c.alerts.some(a => /Visa expires in 2\d days/.test(a)));
      assert.ok(out.c.applications[0].needs_follow_up);
      assert.match(out.d.error, /valid job id/);
      return msg('Done');
    }
  ]);
  const data = await (await handle(req('/api/agent', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'status?' }] } }), ENV, { fetch: b.f })).json();
  assert.equal(data.proposals.length, 0);
});

test('agent caps prepared actions and steps; upstream errors are safe', async () => {
  const many = { output: [0, 1, 2, 3].map(i => fcall('propose_profile_update', { changes: { headline: 'H' + i } }, 'x' + i)) };
  const b = backend([many, msg('ok')]);
  const data = await (await handle(req('/api/agent', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'go' }] } }), ENV, { fetch: b.f })).json();
  assert.equal(data.proposals.length, 3);
  const loop = backend(Array.from({ length: 6 }, () => ({ output: [fcall('get_my_profile', {})] })));
  const r = await (await handle(req('/api/agent', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'go' }] } }), ENV, { fetch: loop.f })).json();
  assert.match(r.reply, /ran out of steps/);
  const err = backend([{}]);
  const errFetch = async (u, o) => (String(u).includes('openai') ? Response.json({ error: { message: 'oa-key' } }, { status: 401 }) : err.f(u, o));
  const e = await handle(req('/api/agent', { method: 'POST', token: 'tok-student', body: { messages: [{ role: 'user', content: 'go' }] } }), ENV, { fetch: errFetch });
  assert.equal(e.status, 502); assert.ok(!(await e.text()).includes('oa-key'));
});

test('confirm executes apply, profile update and withdraw with the student token', async () => {
  const b = backend([]);
  const post = action => handle(req('/api/agent/confirm', { method: 'POST', token: 'tok-student', body: { action } }), ENV, { fetch: b.f });
  const r1 = await post({ type: 'apply', args: { job_id: JOB_ID, cover_note: 'Hello' } });
  assert.equal(r1.status, 200);
  const ins = b.calls.find(c => c.method === 'POST' && c.url.startsWith('/rest/v1/applications'));
  assert.deepEqual(JSON.parse(ins.body)[0], { job_id: JOB_ID, student_id: STUDENT.id, cover_note: 'Hello', video_pitch_id: null });
  assert.equal(ins.auth, 'Bearer tok-student');
  const r2 = await post({ type: 'update_profile', args: { changes: { skills: 'Python, Excel', visa_expiry: '2027-01-31' } } });
  assert.deepEqual((await r2.json()).changes, { skills: ['Python', 'Excel'], visa_expiry: '2027-01-31' });
  assert.equal((await post({ type: 'update_profile', args: { changes: { is_meow_pool_top50: true } } })).status, 400);
  assert.equal((await post({ type: 'withdraw', args: { application_id: APP_ID } })).status, 200);
  assert.equal((await post({ type: 'delete_everything' })).status, 400);
  assert.equal((await handle(req('/api/agent/confirm', { method: 'POST', token: 'tok-company', body: { action: { type: 'apply', args: { job_id: JOB_ID } } } }), ENV, { fetch: b.f })).status, 403);
});

test('profile validation and scoring helpers', () => {
  assert.throws(() => validateProfileChanges({ visa_expiry: 'soon' }), /date/);
  assert.throws(() => validateProfileChanges({ grad_year: 3000 }), /between/);
  assert.deepEqual(validateProfileChanges({ open_to_offers: true, headline: '' }), { open_to_offers: true, headline: null });
  const low = scoreJob(JOBS[1], PROFILE, 'Asok');
  const high = scoreJob(JOBS[0], PROFILE, 'Asok');
  assert.ok(high.score > low.score);
  assert.ok(low.reasons.includes('pays below your salary target'));
});
