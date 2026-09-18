// Reads server configuration from an env object (Vercel/Node: process.env; Workers: bindings).
export function readEnv(source = (typeof process !== 'undefined' ? process.env : {})) {
  const e = source || {};
  const trim = v => (typeof v === 'string' ? v.trim() : '') || '';
  return {
    supabaseUrl: trim(e.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, ''),
    supabaseAnonKey: trim(e.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceKey: trim(e.SUPABASE_SERVICE_KEY),
    openaiKey: trim(e.OPENAI_API_KEY),
    openaiModel: trim(e.OPENAI_MODEL) || 'gpt-5-mini',
    stripeSecretKey: trim(e.STRIPE_SECRET_KEY),
    stripeWebhookSecret: trim(e.STRIPE_WEBHOOK_SECRET),
    poolPriceThb: Number(e.MEOW_POOL_PRICE_THB) > 0 ? Math.round(Number(e.MEOW_POOL_PRICE_THB)) : 3000,
    appUrl: trim(e.APP_URL).replace(/\/+$/, ''),
    cronSecret: trim(e.CRON_SECRET),
    newsProvider: trim(e.NEWS_PROVIDER) || 'mock',
    newsApiKey: trim(e.NEWS_API_KEY),
    ghostingDays: Number(e.GHOSTING_DAYS) > 0 ? Math.round(Number(e.GHOSTING_DAYS)) : 5,
    n8nUrl: trim(e.N8N_WEBHOOK_URL),
    n8nHeader: trim(e.N8N_WEBHOOK_HEADER) || 'X-HireMeow-Key',
    n8nKey: trim(e.N8N_WEBHOOK_KEY),
    localPreview: e.HIREMEOW_LOCAL_PREVIEW === '1',
    raw: e
  };
}
export const hasSupabase = env => Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasService = env => hasSupabase(env) && Boolean(env.supabaseServiceKey);
export const hasStripe = env => Boolean(env.stripeSecretKey);
