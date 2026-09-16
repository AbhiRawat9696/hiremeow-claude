import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../server/app.js';
import { fraudSignals, salaryStats, SKILL_DEFS } from '../server/skills.js';
import { matchJob, matchSentence, skillsIn } from '../public/assets/platform/skills-dict.js';

const ENV = { NEXT_PUBLIC_SUPABASE_URL: 'https://sb.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_KEY: 'service-key', OPENAI_API_KEY: 'oa-key' };
const STUDENT = { id: '11111111-1111-4111-8111-111111111111' };
const COMPANY = { id: '22222222-2222-4222-8222-222222222222' };
const JOB = '33333333-3333-4333-8333-333333333333';
const JOB_OLD = '66666666-6666-4666-8666-666666666666';
const APP = '55555555-5555-4555-8555-555555555555';
const CO_ID = '77777777-7777-4777-8777-777777777777';
const job = { id: JOB, title: 'Frontend Developer', description: 'Build dashboards with React and TypeScript. AWS a plus. 2+ years experience. You will join a friendly product team.', employment_type: 'full_time', salary_min: 40000, salary_max: 60000, status: 'published', company_id: CO_ID, candidate_faq: 'Team of 8. Hybrid, 2 days remote.', companies: { name: 'Siam Pixel', website: 'https://siampixel.test', created_at: '2025-01-01T00:00:00Z' } };

function backend(aiReply = {}) {
  const calls = []; const ai = [];
  const f = async (url, opts = {}) => {
    const u = new URL(url); const auth = opts.headers?.Authorization || '';
    calls.push({ path: u.pathname, q: u.search, method: opts.method || 'GET', auth });
    if (u.hostname === 'api.openai.com') { const b = JSON.parse(opts.body); ai.push(b); const r = typeof aiReply === 'function' ? aiReply(b) : aiReply; return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(r) }] }] }); }
    if (u.pathname === '/auth/v1/user') return auth === 'Bearer tok-s' ? Response.json(STUDENT) : auth === 'Bearer tok-c' ? Response.json(COMPANY) : Response.json({}, { status: 401 });
    if (u.pathname === '/rest/v1/profiles') { const id = (u.searchParams.get('id') || '').replace('eq.', ''); return Response.json([id === COMPANY.id ? { id, role: 'company' } : { id, role: 'student', full_name: 'Aye', skills: ['React', 'JavaScript'], grad_year: 2022, languages: 'English, Thai' }]); }
    if (u.pathname === '/rest/v1/jobs') {
      if (u.searchParams.get('id')) return Response.json(u.searchParams.get('id') === 'eq.' + JOB ? [job] : []);
      if (u.searchParams.get('company_id')) return Response.json([{ id: JOB, title: job.title }, { id: JOB_OLD, title: 'React Intern' }]);
      return Response.json([job, { title: 'React Developer', salary_min: 35000, salary_max: 45000 }, { title: 'Frontend Engineer', description: 'React', salary_min: 50000, salary_max: 70000 }, { title: 'Barista', salary_min: 12000, salary_max: 14000 }]);
    }
    if (u.pathname === '/rest/v1/companies') return Response.json([{ id: CO_ID, name: 'Siam Pixel' }]);
    if (u.pathname === '/rest/v1/applications') {
      const jid = u.searchParams.get('job_id') || '';
      if (u.searchParams.get('select') === 'student_id') return Response.json([]);
      if (jid.startsWith('in.')) return Response.json([{ id: APP, status: 'rejected', created_at: new Date(Date.now() - 60 * 864e5).toISOString(), job_id: JOB_OLD, student_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', profiles: { full_name: 'Min', skills: ['React', 'TypeScript'], open_to_offers: true } }]);
      if (u.searchParams.get('id')?.startsWith('in.')) return Response.json([{ id: APP, cover_note: 'Hi', profiles: { full_name: 'Aye', skills: ['React'], nationality: 'SHOULD_NOT_BE_SELECTED' } }]);
      return Response.json([{ id: APP, status: 'applied', created_at: new Date(Date.now() - 6 * 864e5).toISOString(), jobs: { title: 'Frontend Developer', companies: { name: 'Siam Pixel', contact_email: 'hr@siampixel.test' } } }]);
    }
    return Response.json({ message: 'unexpected ' + u.pathname }, { status: 500 });
  };
  return { f, calls, ai };
}
const post = (path, body, token, headers = {}) => new Request('https://hm.test' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://hm.test', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: JSON.stringify(body) });
const skill = (b, name, input, token = 'tok-s') => handle(post('/api/skill', { skill: name, input }, token), ENV, { fetch: b.f });

test('deterministic match explains percent, strengths and gaps', () => {
  const m = matchJob(job, { skills: ['React'], grad_year: new Date().getFullYear() - 3, desired_salary_min: 45000 });
  assert.deepEqual(m.have, ['react']); assert.deepEqual(m.missing, ['typescript', 'aws']);
  assert.match(matchSentence(m), /^\d+% match because you have react, about 3 years since graduating \(job asks 2\+\).* Missing: typescript, aws\.$/);
  assert.deepEqual(skillsIn('Thailand office'), []);
  assert.ok(matchJob(job, { skills: ['React', 'TypeScript', 'AWS'] }).percent > m.percent);
});

test('skills are gated by sign-in and role', async () => {
  const b = backend({});
  assert.equal((await skill(b, 'roast', { resume_text: 'x' }, null)).status, 401);
  assert.equal((await skill(b, 'jd_writer', { brief: 'x' }, 'tok-s')).status, 403);
  assert.equal((await skill(b, 'tailor_resume', { job_id: JOB, resume_text: 'x' }, 'tok-c')).status, 403);
  assert.equal((await skill(b, 'nope', {}, 'tok-s')).status, 404);
  assert.equal((await skill(b, 'roast', {}, 'tok-s')).status, 400);
  assert.equal((await skill(b, 'roast', { resume_file: { name: 'a.pdf', data: 'data:text/html;base64,AAAA' } }, 'tok-s')).status, 400);
  assert.equal(b.ai.length, 0);
});

test('match_explain and tailor_resume send strict schemas and real data', async () => {
  const b = backend(body => body.text.format.name === 'match_explain'
    ? { summary: 'Good fit', strengths: ['React'], gaps: [{ skill: 'aws', how_to_close: 'Free tier course' }], next_step: 'Apply' }
    : { tailored_resume: 'AYE', ats_score_before: 40, ats_score_after: 80, keywords_added: ['React'], missing_skills: ['AWS'], changes: ['Reordered'] });
  const r = await (await skill(b, 'match_explain', { job_id: JOB })).json();
  assert.equal(r.result.match.missing.includes('aws'), true);
  assert.equal(r.result.summary, 'Good fit');
  const t = await (await skill(b, 'tailor_resume', { job_id: JOB, resume_file: { name: 'cv.pdf', data: 'data:application/pdf;base64,JVBERi0=' } })).json();
  assert.equal(t.result.ats_score_after, 80);
  const sent = b.ai[1];
  assert.equal(sent.text.format.strict, true); assert.equal(sent.store, false);
  assert.equal(sent.text.format.schema.additionalProperties, false);
  assert.deepEqual(sent.input[0].content.map(c => c.type), ['input_text', 'input_file']);
  assert.match(sent.instructions, /Never invent/);
  assert.ok(b.calls.filter(c => c.path.startsWith('/rest/')).every(c => c.auth === 'Bearer tok-s'));
});

test('follow_up, negotiate and salary insight use HireMeow data', async () => {
  const b = backend(body => ({ follow_up: { subject: 'Following up', email: 'Hello' }, negotiate: { market_low: 40000, market_high: 55000, source: 'hiremeow_data', suggested_ask: 48000, reasoning: 'r', script_en: 'e', script_th: 't', other_asks: [], caveat: 'c' }, salary_insight: { low: 1, high: 2, source: 'hiremeow_data', summary: 's', pay_drivers: [], caveat: 'c' } })[body.text.format.name]);
  const f = (await (await skill(b, 'follow_up', { application_id: APP, language: 'th' })).json()).result;
  assert.equal(f.to, 'hr@siampixel.test'); assert.equal(f.days_since, 6);
  assert.match(b.ai[0].instructions, /Thai/);
  const n = (await (await skill(b, 'negotiate', { offer_thb: 40000, role: 'React developer' })).json()).result;
  assert.equal(n.suggested_ask, 48000); assert.equal(n.data.count, 3);
  assert.equal((await skill(b, 'negotiate', { offer_thb: 'lots', role: 'x' })).status, 400);
  const stats = await salaryStats({ select: async () => [{ title: 'Barista', salary_min: 10000, salary_max: 12000 }] }, null, 'data analyst');
  assert.equal(stats.count, 0);
});

test('fraud rules catch common Thai job scams', async () => {
  const scam = { title: 'Customer service (crypto)', description: 'Easy money! Pay a registration fee of 500 baht then add our LINE ID. Work in Cambodia.', employment_type: 'full_time', salary_max: 90000, companies: { created_at: new Date().toISOString() } };
  const flags = fraudSignals(scam);
  for (const re of [/pay money/, /private chat/, /crypto/, /trafficking/, /no website/, /less than a week/]) assert.ok(flags.some(f => re.test(f)), re);
  assert.deepEqual(fraudSignals(job), []);
  const b = backend({ risk: 'high', flags: ['fee'], advice: 'Do not pay. Call 1191.' });
  const r = (await (await skill(b, 'fraud_check', { text: scam.description })).json()).result;
  assert.equal(r.risk, 'high'); assert.ok(r.rule_flags.length >= 3);
});

test('recruiter tools: JD writer, fair screening, talent pool', async () => {
  const b = backend(body => ({
    jd_writer: { title: 'Junior Marketing Executive', employment_type: 'full_time', description: 'About the role', salary_min: 25000, salary_max: 32000, salary_source: 'ai_estimate', salary_note: 'n', candidate_faq: 'Team size [confirm]' },
    screen: { candidates: [{ ref: APP, name: 'Aye', score: 82, strengths: ['React'], red_flags: [], salary_expectation: 'not stated', summary: 'Solid' }, { ref: 'file:cv.pdf', name: 'Bo', score: 60, strengths: [], red_flags: ['No TypeScript'], salary_expectation: '50k', summary: 'OK' }, { ref: 'invented', name: 'X', score: 99, strengths: [], red_flags: [], salary_expectation: '', summary: '' }] },
    talent_pool: { candidates: [{ ref: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', score: 88, why: 'Has React + TypeScript' }, { ref: 'made-up', score: 99, why: 'x' }] }
  })[body.text.format.name]);
  const jd = (await (await skill(b, 'jd_writer', { brief: 'need junior marketing' }, 'tok-c')).json()).result;
  assert.equal(jd.title, 'Junior Marketing Executive');
  assert.match(b.ai[0].instructions, /discriminatory/);
  const sc = (await (await skill(b, 'screen', { job_id: JOB, application_ids: [APP, 'bad-id'], files: [{ name: 'cv.pdf', data: 'data:application/pdf;base64,JVBERi0=' }] }, 'tok-c')).json()).result;
  assert.deepEqual(sc.candidates.map(c => c.ref), [APP, 'file:cv.pdf'], 'drops invented refs');
  const screenCall = b.ai.find(x => x.text.format.name === 'screen');
  assert.match(screenCall.instructions, /never infer nationality/);
  const appQuery = b.calls.find(c => c.path === '/rest/v1/applications' && c.q.includes('id=in.'));
  assert.ok(!decodeURIComponent(appQuery.q).includes('nationality'), 'nationality is not sent to the screener');
  assert.equal((await skill(b, 'screen', { job_id: JOB }, 'tok-c')).status, 400);
  const tp = (await (await skill(b, 'talent_pool', { job_id: JOB }, 'tok-c')).json()).result;
  assert.equal(tp.candidates.length, 1); assert.equal(tp.candidates[0].previous_status, 'rejected'); assert.equal(tp.candidates[0].previous_job, 'React Intern');
});

test('public job chat answers from the ad and FAQ, rate-limited per IP', async () => {
  const b = backend({ answer: 'Team of 8, hybrid.', needs_recruiter: false });
  const r = await handle(post('/api/job-chat', { job_id: JOB, messages: [{ role: 'user', content: 'Team size? Remote?' }] }, null, { 'x-real-ip': '198.51.100.7' }), ENV, { fetch: b.f });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).result.answer, 'Team of 8, hybrid.');
  assert.match(b.ai[0].input[0].content[0].text, /Team of 8/);
  assert.ok(b.calls.filter(c => c.path.startsWith('/rest/')).every(c => c.auth === 'Bearer anon-key'));
  let last;
  for (let i = 0; i < 12; i++) last = await handle(post('/api/job-chat', { job_id: JOB, messages: [{ role: 'user', content: 'hi' }] }, null, { 'x-real-ip': '198.51.100.7' }), ENV, { fetch: b.f });
  assert.equal(last.status, 429);
  assert.equal((await handle(post('/api/job-chat', { job_id: JOB, messages: [] }, null, { 'x-real-ip': '198.51.100.8' }), ENV, { fetch: b.f })).status, 400);
});

test('every skill declares roles and upstream errors never leak keys', async () => {
  for (const [name, d] of Object.entries(SKILL_DEFS)) assert.ok(d.roles.length && typeof d.run === 'function', name);
  const b = backend({});
  const bad = async (u, o) => (String(u).includes('openai') ? Response.json({ error: 'oa-key' }, { status: 500 }) : b.f(u, o));
  const r = await handle(post('/api/skill', { skill: 'roast', input: { resume_text: 'hello' } }, 'tok-s'), ENV, { fetch: bad });
  assert.equal(r.status, 502); assert.ok(!(await r.text()).includes('oa-key'));
});
