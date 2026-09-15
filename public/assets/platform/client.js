// HireMeow platform client: config, Supabase session, API calls, shared React hooks.
const SUPABASE_SRC = 'assets/vendor/supabase-2.116.0.js';
let configPromise = null;
let clientPromise = null;
const listeners = new Set();
let state = { ready: false, live: false, session: null, user: null, profile: null, features: {} };

const inClaudeArtifact = () => typeof window !== 'undefined' && Boolean(window.claude?.use);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.dataset.src = src;
    s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}

export function loadConfig() {
  if (!configPromise) {
    configPromise = inClaudeArtifact()
      ? Promise.resolve({ features: { platform: false } })
      : fetch('/api/config', { cache: 'no-store' }).then(r => (r.ok ? r.json() : { features: { platform: false } })).catch(() => ({ features: { platform: false } }));
  }
  return configPromise;
}

function emit(patch) {
  state = { ...state, ...patch };
  if (typeof window !== 'undefined') window.hiremeowPlatform = { live: state.live, role: state.profile?.role || null, signedIn: Boolean(state.user), ai: Boolean(state.features?.ai) };
  for (const fn of listeners) fn(state);
}

async function loadProfile(sb, user) {
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data || null;
}

export function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const cfg = await loadConfig();
      if (!cfg.features?.platform || !cfg.supabaseUrl || !cfg.supabaseAnonKey) { emit({ ready: true, live: false, features: cfg.features || {} }); return null; }
      await loadScript(SUPABASE_SRC);
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
      const { data } = await sb.auth.getSession();
      const user = data.session?.user || null;
      emit({ ready: true, live: true, features: cfg.features, session: data.session, user, profile: await loadProfile(sb, user).catch(() => null) });
      sb.auth.onAuthStateChange((_event, session) => {
        const u = session?.user || null;
        if (u?.id === state.user?.id && state.profile) { emit({ session, user: u }); return; }
        emit({ session, user: u, profile: null });
        setTimeout(async () => emit({ profile: await loadProfile(sb, u).catch(() => null) }), 0);
      });
      return sb;
    })().catch(err => { console.warn('[HireMeow] platform unavailable:', err.message); emit({ ready: true, live: false }); return null; });
  }
  return clientPromise;
}

export async function refreshProfile() {
  const sb = await getClient();
  if (!sb || !state.user) return null;
  const profile = await loadProfile(sb, state.user);
  emit({ profile });
  return profile;
}

export async function getAccessToken() {
  if (inClaudeArtifact()) return null;
  const sb = await getClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || null;
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = await getAccessToken();
  const res = await fetch(path, {
    method, signal,
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || `Request failed (${res.status})`); err.status = res.status; err.code = data.code; throw err; }
  return data;
}

export const getState = () => state;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function signOut() {
  const sb = await getClient();
  await sb?.auth.signOut();
}

/** React hook: platform state (live, user, profile, role). */
export function makeUsePlatform(React) {
  return function usePlatform() {
    const [s, set] = React.useState(state);
    React.useEffect(() => { const off = subscribe(set); getClient(); set(state); return off; }, []);
    return s;
  };
}

export const friendlyError = e => {
  const m = String(e?.message || e || 'Something went wrong');
  if (/JWT|session/i.test(m)) return 'Your session expired. Please sign in again.';
  if (/row-level security|permission denied/i.test(m)) return 'You don’t have permission to do that.';
  if (/duplicate key.*applications/i.test(m)) return 'You already applied to this job.';
  return m.replace(/^.*?Hiding Treats/, 'Hiding Treats');
};
export const baht = n => (Number.isFinite(+n) && n !== null ? '฿' + Number(n).toLocaleString('en-US') : '—');
export const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Keep Meow Lab results in the signed-in profile.
if (typeof window !== 'undefined') {
  window.addEventListener('hiremeow:lab-saved', async e => {
    try {
      const sb = await getClient();
      if (!sb || !state.user || state.profile?.role !== 'student') return;
      const lab = e.detail || {};
      const patch = {};
      if (lab.score?.score !== undefined) patch.meow_score = lab.score.score;
      if (lab.dna?.type) patch.dna_type = lab.dna.type;
      if (Array.isArray(lab.badges)) patch.badges = lab.badges;
      if (Object.keys(patch).length) { await sb.from('profiles').update(patch).eq('id', state.user.id); refreshProfile(); }
    } catch {}
  });
}
