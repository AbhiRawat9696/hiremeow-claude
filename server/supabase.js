// Minimal Supabase REST client (no npm dependency): Auth user lookup, PostgREST, RPC.
import { HttpError } from './http.js';

export function createSupabase(env, fetchImpl = fetch) {
  const base = env.supabaseUrl;
  const call = async (path, { method = 'GET', body, token, service = false, prefer, headers = {} } = {}) => {
    if (!base) throw new HttpError(503, 'Supabase is not configured.', 'not_configured');
    const key = service ? env.supabaseServiceKey : env.supabaseAnonKey;
    if (!key) throw new HttpError(503, service ? 'SUPABASE_SERVICE_KEY is not set.' : 'Supabase anon key is not set.', 'not_configured');
    const res = await fetchImpl(base + path, {
      method,
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + (service ? key : (token || key)),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
        ...headers
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000)
    });
    const text = await res.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const message = (data && (data.message || data.error_description || data.msg)) || `Supabase request failed (${res.status})`;
      throw new HttpError(res.status >= 500 ? 502 : res.status, message, data?.code);
    }
    return data;
  };
  return {
    async getUser(token) {
      if (!token) return null;
      try { return await call('/auth/v1/user', { token }); } catch (e) { if ([401, 403].includes(e.status)) return null; throw e; }
    },
    select: (table, query, opts = {}) => call(`/rest/v1/${table}?${query}`, opts),
    insert: (table, rows, opts = {}) => call(`/rest/v1/${table}`, { ...opts, method: 'POST', body: rows, prefer: opts.prefer || 'return=representation' }),
    update: (table, query, patch, opts = {}) => call(`/rest/v1/${table}?${query}`, { ...opts, method: 'PATCH', body: patch, prefer: 'return=representation' }),
    rpc: (fn, args = {}, opts = {}) => call(`/rest/v1/rpc/${fn}`, { ...opts, method: 'POST', body: args }),
    raw: call
  };
}

/** Resolves the signed-in user and their profile from the request's bearer token. */
export async function currentUser(sb, token) {
  const user = await sb.getUser(token);
  if (!user?.id) return null;
  const rows = await sb.select('profiles', `id=eq.${encodeURIComponent(user.id)}&select=id,role,full_name`, { token });
  return { id: user.id, email: user.email, role: rows?.[0]?.role || 'student', name: rows?.[0]?.full_name || null };
}
