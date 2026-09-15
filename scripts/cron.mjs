// Run a scheduled job locally: node scripts/cron.mjs ghosting|company-health
try { process.loadEnvFile('.env'); } catch {}
const { readEnv } = await import('../server/env.js');
const { createSupabase } = await import('../server/supabase.js');
const job = process.argv[2];
const env = readEnv(process.env);
if (!env.supabaseServiceKey) { console.error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY in .env first.'); process.exit(1); }
const sb = createSupabase(env);
const jobs = {
  ghosting: async () => (await import('../server/jobs/ghosting.js')).runGhostingCheck(env, sb),
  'company-health': async () => (await import('../server/jobs/company-health.js')).runCompanyHealth(env, sb)
};
if (!jobs[job]) { console.error('Usage: node scripts/cron.mjs ghosting|company-health'); process.exit(1); }
console.log(JSON.stringify(await jobs[job](), null, 2));
