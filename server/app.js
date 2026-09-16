// HireMeow full-stack API for Node / Vercel. The static site lives in /public.
import { readEnv, hasSupabase, hasService, hasStripe } from './env.js';
import { json, HttpError, readJson, sameOrigin, bearer } from './http.js';
import { createSupabase, currentUser } from './supabase.js';
import { handleChat } from './worker.js';
import { generate, rateLimit } from './ai.js';
import { runAgent, createAgentTools, confirmAction } from './agent.js';
import { runSkill, jobChat, SKILL_DEFS } from './skills.js';
import { createPoolCheckout, verifyStripeEvent, retrieveCheckout } from './stripe.js';
import { runGhostingCheck } from './jobs/ghosting.js';
import { runCompanyHealth } from './jobs/company-health.js';

const monthOf = (d = new Date()) => {
  const bkk = new Date(d.getTime() + 7 * 3600 * 1000); // Asia/Bangkok, matches hm_month()
  return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

async function grantPoolAccess(env, sb, session) {
  const md = session.metadata || {};
  if (md.product !== 'meow_pool' || !md.company_id || !/^\d{4}-\d{2}-01$/.test(md.month || '')) return { skipped: true };
  if (session.payment_status !== 'paid') return { skipped: true, reason: 'unpaid' };
  await sb.insert('meow_pool_access?on_conflict=company_id,month', [{
    company_id: md.company_id, month: md.month, stripe_session_id: session.id, amount_thb: Math.round((session.amount_total || 0) / 100)
  }], { service: true, prefer: 'resolution=ignore-duplicates,return=minimal' });
  return { granted: true, company_id: md.company_id, month: md.month };
}

function stripClientIdentity(request) {
  const headers = new Headers(request.headers);
  for (const key of [...headers.keys()]) if (key.startsWith('oai-authenticated-user')) headers.delete(key);
  return headers;
}

const clientIp = request => (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

export async function handle(request, rawEnv, deps = {}) {
  const env = readEnv(rawEnv);
  const fetchImpl = deps.fetch || fetch;
  const log = deps.log || console.log;
  const sb = createSupabase(env, fetchImpl);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method;
  const token = bearer(request);
  const user = async () => (hasSupabase(env) && token ? currentUser(sb, token) : null);
  const requireUser = async () => { const u = await user(); if (!u) throw new HttpError(401, 'Sign in first.', 'not_granted'); return u; };
  const requireAdmin = async () => { const u = await requireUser(); if (u.role !== 'admin') throw new HttpError(403, 'Admins only.'); return u; };
  const requireCron = async () => {
    if (env.cronSecret && token === env.cronSecret) return 'cron';
    await requireAdmin(); return 'admin';
  };
  if (method === 'POST' && !path.startsWith('/api/stripe/webhook') && !path.startsWith('/api/cron/') && !sameOrigin(request)) {
    return json({ error: 'Use HireMeow to send this request.' }, 403);
  }

  try {
    switch (path) {
      case '/api/health':
        return json({ ok: true, supabase: hasSupabase(env), service: hasService(env), stripe: hasStripe(env), ai: Boolean(env.openaiKey) });

      case '/api/config':
        // The anon key is public by design (Row Level Security protects the data).
        return json({
          supabaseUrl: env.supabaseUrl || null,
          supabaseAnonKey: env.supabaseAnonKey || null,
          features: { platform: hasSupabase(env), stripe: hasStripe(env), ai: Boolean(env.openaiKey), poolPriceThb: env.poolPriceThb, ghostingDays: env.ghostingDays }
        }, 200, { 'Cache-Control': 'public, max-age=60' });

      case '/api/chat/status':
      case '/api/chat': {
        const headers = stripClientIdentity(request);
        const u = await user().catch(() => null);
        if (u) headers.set('oai-authenticated-user-id', 'sb:' + u.id);
        else if (env.localPreview) headers.set('oai-authenticated-user-id', 'local-hiremeow-preview');
        const forwarded = new Request(request.url, { method, headers, ...(method === 'POST' ? { body: await request.text() } : {}) });
        const res = await handleChat(forwarded, { OPENAI_API_KEY: env.openaiKey, OPENAI_MODEL: env.openaiModel }, fetchImpl);
        if (path === '/api/chat/status') {
          const status = await res.json();
          const signedIn = Boolean(headers.get('oai-authenticated-user-id'));
          return json({ ...status, available: status.available && signedIn, webSearch: status.webSearch && signedIn, signInRequired: status.available && !signedIn });
        }
        return res;
      }

      case '/api/ai/status': {
        const u = await user().catch(() => null);
        return json({ available: Boolean(env.openaiKey) && Boolean(u || env.localPreview), signInRequired: Boolean(env.openaiKey) && !u && !env.localPreview });
      }
      case '/api/ai': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = env.localPreview && !token ? { id: 'local' } : await requireUser();
        rateLimit('ai:' + u.id);
        const body = await readJson(request, 120000);
        return json(await generate(env, { messages: body.messages, format: body.format === 'json' ? 'json' : 'text' }, fetchImpl));
      }

      case '/api/agent/status': {
        const u = await user().catch(() => null);
        const ready = Boolean(env.openaiKey) && hasSupabase(env);
        return json({ available: ready && u?.role === 'student', signInRequired: ready && !u, studentOnly: ready && Boolean(u) && u.role !== 'student' });
      }
      case '/api/agent': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = await requireUser();
        if (u.role !== 'student') throw new HttpError(403, 'Meow Agent is for student accounts.');
        rateLimit('agent:' + u.id, 10);
        const body = await readJson(request, 60000);
        return json(await runAgent(env, { messages: body.messages, tools: createAgentTools(sb, token, u) }, fetchImpl));
      }
      case '/api/agent/confirm': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = await requireUser();
        if (u.role !== 'student') throw new HttpError(403, 'Meow Agent is for student accounts.');
        rateLimit('agent-confirm:' + u.id, 20);
        const body = await readJson(request, 10000);
        return json(await confirmAction(sb, token, u, body.action));
      }

      case '/api/skill': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = await requireUser();
        const body = await readJson(request, 12_000_000);
        const def = SKILL_DEFS[body.skill];
        rateLimit('skill:' + u.id, def?.roles?.includes('company') && body.skill === 'screen' ? 40 : 15);
        return json({ result: await runSkill(env, sb, token, u, body.skill, body.input, fetchImpl) });
      }
      case '/api/job-chat': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        if (!env.openaiKey) throw new HttpError(503, 'Live AI is not connected.', 'not_configured');
        rateLimit('jobchat:' + clientIp(request), 12);
        const body = await readJson(request, 20000);
        return json({ result: await jobChat(env, sb, body, fetchImpl) });
      }

      case '/api/stripe/checkout': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = await requireUser();
        if (u.role !== 'company') throw new HttpError(403, 'Only company accounts can buy Meow Pool access.');
        const rows = await sb.select('companies', `owner_id=eq.${u.id}&select=id,name&limit=1`, { token });
        if (!rows?.length) throw new HttpError(400, 'Create your company profile first.');
        const month = monthOf();
        const existing = await sb.select('meow_pool_access', `company_id=eq.${rows[0].id}&month=eq.${month}&select=id`, { token });
        if (existing?.length) return json({ alreadyPaid: true });
        return json(await createPoolCheckout(env, { companyId: rows[0].id, companyName: rows[0].name, month, userId: u.id, email: u.email, origin: url.origin }, fetchImpl));
      }
      case '/api/stripe/confirm': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const u = await requireUser();
        const { session_id } = await readJson(request);
        const session = await retrieveCheckout(env, session_id, fetchImpl);
        if (session.metadata?.user_id !== u.id) throw new HttpError(403, 'This payment belongs to another account.');
        return json(await grantPoolAccess(env, sb, session));
      }
      case '/api/stripe/webhook': {
        if (method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const payload = await request.text();
        const event = verifyStripeEvent(payload, request.headers.get('stripe-signature'), env.stripeWebhookSecret);
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
          return json({ received: true, ...(await grantPoolAccess(env, sb, event.data.object)) });
        }
        return json({ received: true, ignored: event.type });
      }

      case '/api/cron/ghosting': {
        const by = await requireCron();
        const result = await runGhostingCheck(env, sb, log);
        return json({ ok: true, by, ...result });
      }
      case '/api/cron/company-health': {
        const by = await requireCron();
        return json({ ok: true, by, ...(await runCompanyHealth(env, sb, fetchImpl, log)) });
      }
    }
    if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return null; // not an API route
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
    log('[api] unexpected error', e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
