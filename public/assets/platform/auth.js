// Sign in / sign up (email + password, magic link, Google) and the account menu.
import { getClient, signOut, friendlyError } from './client.js';

export function createAuth(React, ui) {
  const h = React.createElement;

  function AuthDialog({ onClose, initialRole = 'student' }) {
    const [mode, setMode] = React.useState(initialRole === 'company' ? 'signup' : 'signin');
    const [role, setRole] = React.useState(initialRole);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const dialog = React.useRef(null);
    React.useEffect(() => {
      const d = dialog.current; d?.showModal?.();
      const onKey = e => { if (e.key === 'Escape') onClose(); };
      d?.addEventListener('cancel', onClose); window.addEventListener('keydown', onKey);
      return () => { d?.removeEventListener('cancel', onClose); window.removeEventListener('keydown', onKey); };
    }, []);
    const redirectTo = window.location.origin + window.location.pathname;
    const run = async fn => { setBusy(true); setMsg(null); try { await fn(); } catch (e) { setMsg({ tone: 'error', text: friendlyError(e) }); } finally { setBusy(false); } };
    const submit = e => {
      e.preventDefault();
      run(async () => {
        const sb = await getClient();
        if (mode === 'signin') {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error; onClose();
        } else if (mode === 'signup') {
          const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { full_name: name.trim(), role } } });
          if (error) throw error;
          if (data.session) onClose();
          else setMsg({ tone: 'good', text: 'Check your inbox to confirm your email, then sign in.' });
        } else {
          const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true, data: { role } } });
          if (error) throw error;
          setMsg({ tone: 'good', text: 'Magic link sent. Open it on this device to sign in.' });
        }
      });
    };
    const google = () => run(async () => {
      const sb = await getClient();
      try { sessionStorage.setItem('hiremeow.signupRole', role); } catch {}
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
    });
    const tabs = [['signin', 'Sign in'], ['signup', 'Create account'], ['magic', 'Email link']];
    return h('dialog', { ref: dialog, className: 'pf-dialog', 'aria-labelledby': 'auth-title', onClick: e => { if (e.target === dialog.current) onClose(); } },
      h('form', { className: 'pf-auth', onSubmit: submit },
        h('div', { className: 'lab-row lab-between' }, h('h2', { id: 'auth-title' }, mode === 'signup' ? 'Join HireMeow' : 'Welcome back'), h('button', { type: 'button', className: 'pf-x', onClick: onClose, 'aria-label': 'Close' }, '×')),
        h('div', { className: 'pf-seg', role: 'tablist' }, ...tabs.map(([id, t]) => h('button', { key: id, type: 'button', role: 'tab', 'aria-selected': mode === id, className: mode === id ? 'on' : '', onClick: () => { setMode(id); setMsg(null); } }, t))),
        mode !== 'signin' && h('fieldset', { className: 'lab-seg' }, h('legend', { className: 'lab-label' }, 'I am'),
          ...[['student', '🎓 A student or graduate'], ['company', '🏢 Hiring for a company']].map(([id, t]) => h('label', { key: id, className: role === id ? 'on' : '' }, h('input', { type: 'radio', name: 'auth-role', id: 'auth-role-' + id, checked: role === id, onChange: () => setRole(id) }), t))),
        mode === 'signup' && h(ui.Field, { id: 'auth-name', label: 'Full name' }, h(ui.Input, { id: 'auth-name', value: name, onChange: setName, autoComplete: 'name', required: true, maxLength: 120 })),
        h(ui.Field, { id: 'auth-email', label: 'Email' }, h(ui.Input, { id: 'auth-email', type: 'email', value: email, onChange: setEmail, autoComplete: 'email', required: true })),
        mode !== 'magic' && h(ui.Field, { id: 'auth-password', label: 'Password', hint: mode === 'signup' ? 'At least 8 characters.' : undefined },
          h(ui.Input, { id: 'auth-password', type: 'password', value: password, onChange: setPassword, autoComplete: mode === 'signup' ? 'new-password' : 'current-password', required: true, minLength: mode === 'signup' ? 8 : undefined })),
        msg && h(ui.Notice, { tone: msg.tone }, msg.text),
        h('button', { type: 'submit', className: 'lab-btn pf-wide', disabled: busy }, busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send me a link'),
        h('div', { className: 'pf-or' }, h('span', null, 'or')),
        h('button', { type: 'button', className: 'lab-btn-ghost pf-wide pf-google', onClick: google, disabled: busy },
          h('svg', { viewBox: '0 0 48 48', width: 18, height: 18, 'aria-hidden': true },
            h('path', { fill: '#EA4335', d: 'M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z' }),
            h('path', { fill: '#4285F4', d: 'M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z' }),
            h('path', { fill: '#FBBC05', d: 'M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z' }),
            h('path', { fill: '#34A853', d: 'M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z' })),
          'Continue with Google'),
        h('p', { className: 'lab-tiny' }, 'By continuing you agree that HireMeow stores your account details in Supabase to run your profile, applications and offers.')));
  }

  // After a Google sign-up, apply the role picked before the redirect (only student → company is allowed).
  async function applyPendingRole(profile) {
    let pending = null; try { pending = sessionStorage.getItem('hiremeow.signupRole'); sessionStorage.removeItem('hiremeow.signupRole'); } catch {}
    if (pending === 'company' && profile?.role === 'student' && Date.now() - new Date(profile.created_at).getTime() < 10 * 60 * 1000) {
      const sb = await getClient(); await sb.from('profiles').update({ role: 'company' }).eq('id', profile.id); return true;
    }
    return false;
  }

  function AccountButton({ platform, onOpenAuth, onNavigate }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
      const esc = e => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
      return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
    }, [open]);
    if (!platform.live) return null;
    if (!platform.user) return h('button', { type: 'button', className: 'pf-signin', onClick: onOpenAuth }, 'Sign in');
    const p = platform.profile;
    const name = p?.full_name || platform.user.email;
    const initials = (name || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    const go = v => { setOpen(false); onNavigate(v); };
    return h('div', { className: 'pf-account', ref },
      h('button', { type: 'button', className: 'pf-avatar-btn', 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: () => setOpen(!open), title: name }, h('span', { className: 'pf-avatar' }, initials)),
      open && h('div', { className: 'pf-menu', role: 'menu' },
        h('p', { className: 'pf-menu-head' }, h('strong', null, name), h('small', null, (p?.role || 'student') + ' account')),
        h('button', { role: 'menuitem', onClick: () => go(p?.role === 'company' ? 'companies' : 'profile') }, p?.role === 'company' ? 'Company dashboard' : 'My profile'),
        h('button', { role: 'menuitem', onClick: () => go('jobs') }, 'Jobs'),
        h('button', { role: 'menuitem', onClick: () => go('pool') }, 'Meow Pool'),
        p?.role === 'admin' && h('button', { role: 'menuitem', onClick: () => go('admin') }, 'Admin'),
        h('button', { role: 'menuitem', onClick: () => { setOpen(false); signOut(); } }, 'Sign out')));
  }

  return { AuthDialog, AccountButton, applyPendingRole };
}
