// Meow Agent: floating job-search agent for signed-in students.
// The agent can only PREPARE actions; the student presses Confirm to run each one.
import { api, baht, friendlyError, refreshProfile } from './client.js';

const STARTERS = [
  'Find jobs that match my profile',
  'What’s the status of my applications?',
  'Find internships near my BTS station with visa support',
  'Update my skills to: ',
  'หางาน marketing แถวสาทร เงินเดือน 30k'
];
const SR = () => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
const TYPE = { full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship', contract: 'Contract' };

export function createAgent(React) {
  const h = React.createElement;

  function JobMini({ job, onNavigate }) {
    return h('li', { className: 'ma-job' },
      h('div', { className: 'ma-job-top' },
        h('strong', null, job.title),
        job.match_score != null && h('span', { className: 'ma-score', title: 'Match score' }, Math.max(0, Math.round(job.match_score)))),
      h('p', null, [job.company, TYPE[job.type], job.bts && 'BTS ' + job.bts, job.mrt && 'MRT ' + job.mrt].filter(Boolean).join(' · ')),
      h('p', { className: 'ma-salary' }, `${baht(job.salary_min)} – ${baht(job.salary_max)} / month`, job.visa_support ? ' · Visa support' : ''),
      job.why?.length > 0 && h('p', { className: 'ma-why' }, 'Why: ' + job.why.join('; ')),
      job.already_applied && h('p', { className: 'ma-why' }, '✓ You already applied'),
      h('button', { type: 'button', className: 'ma-linkbtn', onClick: () => onNavigate('jobs') }, 'Open in Jobs →'));
  }

  function Proposal({ p, onDone }) {
    const [state, setState] = React.useState('idle');
    const [note, setNote] = React.useState(p.args?.cover_note || '');
    const [msg, setMsg] = React.useState('');
    const confirm = async () => {
      setState('busy'); setMsg('');
      try {
        const action = p.type === 'apply' ? { ...p, args: { ...p.args, cover_note: note } } : p;
        const r = await api('/api/agent/confirm', { method: 'POST', body: { action: { type: action.type, args: action.args } } });
        setState('done'); setMsg(r.message || 'Done.');
        if (p.type === 'update_profile') refreshProfile();
        onDone?.(p, r);
      } catch (e) { setState('idle'); setMsg(friendlyError(e)); }
    };
    const changes = p.type === 'update_profile' ? Object.entries(p.args.changes || {}) : [];
    return h('div', { className: 'ma-proposal ma-' + state },
      h('p', { className: 'ma-proposal-title' }, (p.type === 'apply' ? '📨 ' : p.type === 'withdraw' ? '↩️ ' : '✏️ ') + p.summary),
      p.type === 'apply' && h('label', { className: 'ma-field' }, h('span', null, 'Cover note (you can edit it)'),
        h('textarea', { value: note, onChange: e => setNote(e.target.value), rows: 5, maxLength: 1500, disabled: state !== 'idle' })),
      p.type === 'apply' && p.args.attach_pitch && h('p', { className: 'ma-why' }, 'Your 60-second pitch video will be attached.'),
      changes.length > 0 && h('ul', { className: 'ma-changes' }, ...changes.map(([k, v]) => h('li', { key: k }, h('b', null, k.replace(/_/g, ' ') + ': '), Array.isArray(v) ? v.join(', ') : v === null ? '(clear)' : String(v)))),
      msg && h('p', { className: state === 'done' ? 'ma-ok' : 'ma-err', role: 'status' }, msg),
      state !== 'done' && state !== 'cancelled' && h('div', { className: 'ma-actions' },
        h('button', { type: 'button', className: 'ma-confirm', onClick: confirm, disabled: state === 'busy' || (p.type === 'apply' && !note.trim()) }, state === 'busy' ? 'Working…' : p.type === 'apply' ? 'Confirm & send' : 'Confirm'),
        h('button', { type: 'button', className: 'ma-cancel', onClick: () => { setState('cancelled'); setMsg('Cancelled. Nothing was changed.'); }, disabled: state === 'busy' }, 'Cancel')),
      state === 'cancelled' && h('p', { className: 'ma-why' }, 'Cancelled. Nothing was changed.'));
  }

  function MeowAgent({ platform, onOpenAuth, onNavigate }) {
    const [open, setOpen] = React.useState(false);
    const [status, setStatus] = React.useState(null);
    const [items, setItems] = React.useState([]);
    const [text, setText] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const listRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const ctrl = React.useRef(null);
    const recRef = React.useRef(null);
    const [listening, setListening] = React.useState(false);
    const [voiceLang, setVoiceLang] = React.useState('th-TH');
    React.useEffect(() => () => recRef.current?.abort?.(), []);

    React.useEffect(() => {
      if (!open || !platform.live) return;
      let live = true;
      api('/api/agent/status').then(s => live && setStatus(s)).catch(() => live && setStatus({ available: false }));
      return () => { live = false; };
    }, [open, platform.user?.id, platform.profile?.role, platform.live]);
    React.useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [items, busy]);
    React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
    React.useEffect(() => { setItems([]); }, [platform.user?.id]);
    React.useEffect(() => {
      if (!open) return;
      const onKey = e => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!platform.ready || !platform.live) return null;

    const send = async value => {
      const q = (value ?? text).trim();
      if (!q || busy) return;
      const history = [...items.filter(i => i.role === 'user' || (i.role === 'assistant' && i.text)).map(i => ({ role: i.role, content: i.text + (i.proposals?.length ? '\n[Prepared for confirmation: ' + i.proposals.map(p => p.summary).join('; ') + ']' : '') })), { role: 'user', content: q }].slice(-12);
      while (history[0]?.role !== 'user') history.shift();
      setItems(list => [...list, { role: 'user', text: q }]);
      setText(''); setBusy(true);
      ctrl.current = new AbortController();
      try {
        const r = await api('/api/agent', { method: 'POST', body: { messages: history }, signal: ctrl.current.signal });
        setItems(list => [...list, { role: 'assistant', text: r.reply, proposals: r.proposals || [], jobs: r.jobs || [] }]);
      } catch (e) {
        if (e.name !== 'AbortError') setItems(list => [...list, { role: 'error', text: friendlyError(e) }]);
      } finally { setBusy(false); ctrl.current = null; }
    };
    const listen = () => {
      const R = SR(); if (!R) return;
      if (listening) { recRef.current?.stop(); return; }
      const rec = new R(); recRef.current = rec;
      rec.lang = voiceLang; rec.interimResults = true; rec.continuous = false;
      let finalText = '';
      rec.onresult = e => { const t = [...e.results].map(r => r[0].transcript).join(' '); setText(t); if (e.results[e.results.length - 1].isFinal) finalText = t; };
      rec.onerror = () => setListening(false);
      rec.onend = () => { setListening(false); if (finalText.trim()) send(finalText); };
      rec.start(); setListening(true);
    };
    const noteDone = (p, r) => setItems(list => [...list, { role: 'system', text: `✓ ${r.message}` }]);

    const body = () => {
      if (!platform.user) return h('div', { className: 'ma-empty' }, h('p', null, 'Sign in with a student account to let Meow Agent find jobs, prepare applications and track your progress.'), h('button', { type: 'button', className: 'ma-confirm', onClick: () => { setOpen(false); onOpenAuth('student'); } }, 'Sign in or join'));
      if (!status) return h('div', { className: 'ma-empty' }, h('p', null, 'Waking up Meow…'));
      if (status.studentOnly) return h('div', { className: 'ma-empty' }, h('p', null, 'Meow Agent is for student accounts. Company tools are in the Companies tab.'));
      if (!status.available) return h('div', { className: 'ma-empty' }, h('p', null, 'Meow Agent isn’t available right now. Please try again later.'));
      return h(React.Fragment, null,
        h('div', { className: 'ma-list', ref: listRef, 'aria-live': 'polite' },
          items.length === 0 && h('div', { className: 'ma-empty' },
            h('p', null, `Hi${platform.profile?.full_name ? ' ' + platform.profile.full_name.split(' ')[0] : ''}! I can find HireMeow jobs that fit you, prepare applications, update your profile and keep an eye on your applications and visa date. I always ask before sending anything.`),
            h('div', { className: 'ma-starters' }, ...STARTERS.map(s => h('button', { key: s, type: 'button', onClick: () => (s.endsWith(': ') ? (setText(s), inputRef.current?.focus()) : send(s)) }, s)))),
          ...items.map((it, i) => h('div', { key: i, className: 'ma-msg ma-' + it.role },
            it.text && h('p', { className: 'ma-text' }, it.text),
            it.jobs?.length > 0 && h('ul', { className: 'ma-jobs' }, ...it.jobs.map(j => h(JobMini, { key: j.id, job: j, onNavigate: v => { setOpen(false); onNavigate(v); } }))),
            ...(it.proposals || []).map(p => h(Proposal, { key: p.id, p, onDone: noteDone })))),
          busy && h('div', { className: 'ma-msg ma-assistant' }, h('p', { className: 'ma-typing' }, 'Meow is working', h('span', null, '…')))),
        h('form', { className: 'ma-form', onSubmit: e => { e.preventDefault(); send(); } },
          h('label', { htmlFor: 'ma-input', className: 'hm-visually-hidden' }, 'Message Meow Agent'),
          SR() && h('div', { className: 'ma-voice' },
            h('button', { type: 'button', className: 'ma-mic' + (listening ? ' on' : ''), onClick: listen, disabled: busy, 'aria-pressed': listening, 'aria-label': listening ? 'Stop voice input' : 'Speak your request' }, listening ? '⏹' : '🎤'),
            h('button', { type: 'button', className: 'ma-lang', onClick: () => setVoiceLang(l => (l === 'th-TH' ? 'en-US' : 'th-TH')), 'aria-label': 'Voice language', title: 'Voice language' }, voiceLang === 'th-TH' ? 'ไทย' : 'EN')),
          h('textarea', { id: 'ma-input', ref: inputRef, value: text, rows: 2, maxLength: 2000, placeholder: listening ? 'Listening… speak now' : 'e.g. Find remote jobs under 50k, or tap 🎤 and speak Thai', onChange: e => setText(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }),
          busy ? h('button', { type: 'button', className: 'ma-cancel', onClick: () => ctrl.current?.abort() }, 'Stop')
            : h('button', { type: 'submit', className: 'ma-confirm', disabled: !text.trim() }, 'Send')),
        h('p', { className: 'ma-foot' }, 'Uses OpenAI with your profile and HireMeow data. Nothing is sent to employers until you press Confirm. ',
          items.length > 0 && h('button', { type: 'button', className: 'ma-linkbtn', onClick: () => setItems([]) }, 'New chat')));
    };

    return h(React.Fragment, null,
      !open && h('button', { type: 'button', className: 'ma-fab', onClick: () => setOpen(true), 'aria-haspopup': 'dialog' }, h('span', { 'aria-hidden': true }, '🐾'), ' Meow Agent'),
      open && h('section', { className: 'ma-panel', role: 'dialog', 'aria-label': 'Meow Agent' },
        h('header', { className: 'ma-head' },
          h('div', null, h('strong', null, '🐾 Meow Agent'), h('small', null, 'Your job-search assistant')),
          h('button', { type: 'button', className: 'ma-close', onClick: () => setOpen(false), 'aria-label': 'Close Meow Agent' }, '×')),
        body()));
  }

  return { MeowAgent };
}
