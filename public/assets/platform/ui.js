// Shared UI pieces for the live platform views.
import { baht } from './client.js';

export function createUi(React) {
  const h = React.createElement;

  const Notice = ({ tone = 'info', children }) => h('div', { className: 'pf-notice pf-' + tone, role: tone === 'error' ? 'alert' : 'status' }, children);

  const SetupNeeded = ({ what = 'this feature' }) => h('div', { className: 'pf-card pf-setup' },
    h('h3', null, 'Connect Supabase to turn on ' + what),
    h('p', null, 'This copy of HireMeow is running without a database, so sign-in, jobs, offers and payments are switched off.'),
    h('ol', null,
      h('li', null, 'Create a Supabase project and run ', h('code', null, 'supabase/schema.sql'), ' then ', h('code', null, 'supabase/seed.sql'), ' in its SQL Editor.'),
      h('li', null, 'Copy ', h('code', null, '.env.example'), ' to ', h('code', null, '.env'), ' (or Vercel environment variables) and add your keys.'),
      h('li', null, 'Restart the preview or redeploy.')),
    h('p', { className: 'pf-muted' }, 'Full steps are in README.md.'));

  const Field = ({ id, label, hint, children }) => h('label', { className: 'pf-field', htmlFor: id }, h('span', null, label), children, hint && h('small', null, hint));
  const Input = ({ id, value, onChange, ...rest }) => h('input', { id, className: 'lab-input', value: value ?? '', onChange: e => onChange(e.target.value), ...rest });
  const Select = ({ id, value, onChange, options, placeholder }) => h('select', { id, className: 'lab-input', value: value ?? '', onChange: e => onChange(e.target.value) },
    placeholder !== undefined && h('option', { value: '' }, placeholder),
    ...options.map(o => (Array.isArray(o) ? h('option', { key: o[0], value: o[0] }, o[1]) : h('option', { key: o, value: o }, o))));
  const TextArea = ({ id, value, onChange, ...rest }) => h('textarea', { id, className: 'lab-input', value: value ?? '', onChange: e => onChange(e.target.value), ...rest });

  const Salary = ({ min, max, compact }) => (min && max)
    ? h('span', { className: 'pf-salary' }, `${baht(min)} – ${baht(max)}`, !compact && h('small', null, ' / month'))
    : h('span', { className: 'demo-hiding', title: 'This listing has no salary range, so it cannot be published.' }, 'Hiding Treats 🐟');

  const HEALTH = { green: ['Healthy', 'good'], yellow: ['Watch', 'warn'], red: ['Risk', 'bad'] };
  const HealthPaw = ({ health, note }) => {
    const [label, tone] = HEALTH[health] || HEALTH.green;
    return h('span', { className: 'pf-health pf-health-' + tone, title: note || label }, h('span', { 'aria-hidden': true }, '🐾'), label);
  };
  const ReplyRate = ({ rate, days }) => {
    const r = Math.round(Number(rate ?? 100));
    const tone = r >= 75 ? 'good' : r >= 50 ? 'warn' : 'bad';
    return h('span', { className: 'pf-rate pf-rate-' + tone, title: days ? `Usually replies within ${days} days` : undefined }, `Replies ${r}% of the time`);
  };

  const Empty = ({ icon = '🐾', children }) => h('div', { className: 'pd-empty pf-empty' }, h('span', { 'aria-hidden': true }, icon), h('p', null, children));

  const STATUS_STEPS = ['applied', 'viewed', 'shortlisted', 'interview', 'offer'];
  const label = s => s[0].toUpperCase() + s.slice(1);
  const Timeline = ({ status, events = [] }) => {
    const idx = STATUS_STEPS.indexOf(status);
    const at = Object.fromEntries(events.map(e => [e.status, e.created_at]));
    if (status === 'rejected' || status === 'withdrawn') return h('p', { className: 'pf-closed' }, status === 'rejected' ? 'Not selected this time' : 'You withdrew this application');
    return h('ol', { className: 'pd-track', 'aria-label': 'Application progress' }, ...STATUS_STEPS.map((st, i) =>
      h('li', { key: st, className: i < idx ? 'past' : i === idx ? 'now' : '' },
        h('span', { className: 'pf-step-inner', 'aria-current': i === idx ? 'step' : undefined },
          h('span', { className: 'pd-dot', 'aria-hidden': true }), h('span', { className: 'pd-step' }, label(st)),
          at[st] && h('span', { className: 'pd-date' }, new Date(at[st]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))))));
  };

  const VideoPlayer = ({ path, sb }) => {
    const [url, setUrl] = React.useState(null);
    const [err, setErr] = React.useState('');
    React.useEffect(() => {
      let live = true; setUrl(null); setErr('');
      if (!path || !sb) return;
      sb.storage.from('pitch-videos').createSignedUrl(path, 3600).then(({ data, error }) => {
        if (!live) return; if (error) setErr('Video unavailable'); else setUrl(data.signedUrl);
      });
      return () => { live = false; };
    }, [path, sb]);
    if (!path) return null;
    return h('div', { className: 'pf-video' }, url ? h('video', { src: url, controls: true, playsInline: true, preload: 'metadata' }) : h('span', null, err || 'Loading video…'));
  };

  return { Notice, SetupNeeded, Field, Input, Select, TextArea, Salary, HealthPaw, ReplyRate, Empty, Timeline, VideoPlayer, label };
}
