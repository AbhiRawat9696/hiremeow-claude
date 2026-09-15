import { getCompanyNews, healthFromNews } from '../news/index.js';
/** Layoff Radar: refresh company_health from news. Run daily (Vercel Cron → /api/cron/company-health). */
export async function runCompanyHealth(env, sb, fetchImpl = fetch, log = console.log) {
  const companies = await sb.select('companies', 'select=id,name,health_locked&health_locked=eq.false&limit=500', { service: true });
  const summary = { checked: 0, green: 0, yellow: 0, red: 0, errors: 0, provider: env.newsApiKey ? env.newsProvider : 'mock' };
  for (const c of companies || []) {
    try {
      const items = await getCompanyNews(env, c, fetchImpl);
      if (items.length) {
        await sb.insert('company_news?on_conflict=company_id,headline', items.map(i => ({ company_id: c.id, ...i })), { service: true, prefer: 'resolution=ignore-duplicates,return=minimal' });
      }
      const { health, note } = healthFromNews(items);
      await sb.update('companies', `id=eq.${c.id}`, { company_health: health, health_note: note, health_checked_at: new Date().toISOString() }, { service: true });
      summary.checked++; summary[health]++;
    } catch (e) { summary.errors++; log(`[company-health] ${c.name}: ${e.message}`); }
  }
  return summary;
}
