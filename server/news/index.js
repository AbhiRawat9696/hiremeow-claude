import { fetchMockNews } from './mock-news.js';
const NEGATIVE = /\b(layoffs?|laid off|redundanc|restructur|closes?|closure|bankrupt|insolv|hiring freeze|pauses hiring|lawsuit|fraud)\b/i;
const POSITIVE = /\b(raises?|funding|expands?|expansion|opens?|launch|hiring|record|profit|award)\b/i;
export const classify = text => (NEGATIVE.test(text) ? 'negative' : POSITIVE.test(text) ? 'positive' : 'neutral');

/** Returns recent headlines for a company. Plug a real provider in here (keep the same shape). */
export async function getCompanyNews(env, company, fetchImpl = fetch) {
  if (env.newsProvider === 'mock' || !env.newsApiKey) return fetchMockNews(company);
  if (env.newsProvider === 'newsapi') {
    // Placeholder for https://newsapi.org — set NEWS_PROVIDER=newsapi and NEWS_API_KEY.
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(`"${company.name}" Thailand`)}&sortBy=publishedAt&pageSize=5&language=en`;
    const res = await fetchImpl(url, { headers: { 'X-Api-Key': env.newsApiKey }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`News provider error ${res.status}`);
    const data = await res.json();
    return (data.articles || []).map(a => ({ headline: String(a.title || '').slice(0, 300), url: a.url || null, source: a.source?.name || 'newsapi', published_at: a.publishedAt || null, sentiment: classify(`${a.title} ${a.description || ''}`) }));
  }
  throw new Error(`Unknown NEWS_PROVIDER "${env.newsProvider}"`);
}

/** green: nothing worrying · yellow: one negative signal · red: two or more negative signals */
export function healthFromNews(items) {
  const neg = items.filter(i => i.sentiment === 'negative').length;
  const pos = items.filter(i => i.sentiment === 'positive').length;
  const health = neg >= 2 ? 'red' : neg === 1 ? (pos >= 1 ? 'yellow' : 'red') : 'green';
  const top = items.find(i => i.sentiment === (health === 'green' ? 'positive' : 'negative')) || items[0];
  return { health, note: top ? top.headline : 'No recent news' };
}
