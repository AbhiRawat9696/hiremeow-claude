// Mock news provider for Layoff Radar. Deterministic per company and day so results are stable.
const TEMPLATES = [
  ['{c} raises new funding to expand its Bangkok team', 'positive'],
  ['{c} opens a new office near the BTS line', 'positive'],
  ['{c} launches graduate hiring programme', 'positive'],
  ['{c} reports steady quarterly results', 'neutral'],
  ['{c} appoints a new country manager', 'neutral'],
  ['{c} pauses hiring in two departments', 'negative'],
  ['{c} announces restructuring and layoffs', 'negative']
];
const hash = s => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export async function fetchMockNews(company, day = new Date().toISOString().slice(0, 10)) {
  const h = hash(company.name + day);
  const count = 1 + (h % 2);
  return Array.from({ length: count }, (_, i) => {
    const [t, sentiment] = TEMPLATES[(h >>> (i * 3)) % TEMPLATES.length];
    return { headline: t.replace('{c}', company.name) + ' (mock)', sentiment, source: 'HireMeow mock news', url: null, published_at: new Date().toISOString() };
  });
}
