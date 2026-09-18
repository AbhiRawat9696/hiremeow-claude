// Visa answers from the HireMeow n8n workflow (Phase 1: visa task only).
// The webhook URL and its secret are server-only environment variables.
import { HttpError } from './http.js';

export const hasN8n = env => Boolean(env.n8nUrl && env.n8nKey);

export function validateHistory(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, 'History must be a list of messages.');
  return value.slice(-8).map(m => {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim()) {
      throw new HttpError(400, 'Each history message needs a role and text.');
    }
    return { role: m.role, content: m.content.slice(0, 4000) };
  });
}

export async function askVisa(env, { message, history }, fetchImpl = fetch) {
  if (!hasN8n(env)) throw new HttpError(503, 'The visa assistant is not connected.', 'not_configured');
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text) throw new HttpError(400, 'Type your visa question first.');
  if (text.length > 8000) throw new HttpError(413, 'Please shorten the question.');
  const turns = validateHistory(history);

  let res;
  try {
    res = await fetchImpl(env.n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [env.n8nHeader]: env.n8nKey },
      body: JSON.stringify({ task: 'visa', message: text, history: turns }),
      signal: AbortSignal.timeout(45000)
    });
  } catch (e) {
    throw new HttpError(e?.name === 'TimeoutError' ? 504 : 502, 'The visa assistant did not answer in time.', 'upstream_error');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const code = data.code === 'AI_UNAVAILABLE' ? 'ai_unavailable' : res.status === 401 || res.status === 403 ? 'not_configured' : 'upstream_error';
    const status = res.status === 401 || res.status === 403 ? 503 : res.status >= 400 && res.status < 600 ? res.status : 502;
    throw new HttpError(status, data.message || 'The visa assistant is temporarily unavailable.', code);
  }
  const answer = typeof data.message === 'string' ? data.message.trim() : '';
  if (!answer) throw new HttpError(502, 'No answer was returned.', 'empty_completion');
  return { text: answer, source: 'n8n' };
}
