export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
export async function readJson(request, limit = 200000) {
  const text = await request.text();
  if (text.length > limit) throw new HttpError(413, 'Request is too large.');
  try { return text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, 'Send valid JSON.'); }
}
export function sameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin || request.headers.get('sec-fetch-site') === 'same-origin';
}
export const bearer = request => (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1] || '';
