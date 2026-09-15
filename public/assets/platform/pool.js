// Meow Pool (Top 50 each month) with Stripe test-mode checkout, plus the admin panel.
import { getClient, api, friendlyError, fmtDate, baht } from './client.js';

export function createPool(React, ui) {
  const h = React.createElement;

  function MeowPool({ platform, onOpenAuth, onNavigate }) {
    const [rows, setRows] = React.useState(null);
    const [msg, setMsg] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [sb, setSb] = React.useState(null);
    const role = platform.profile?.role;
    const price = platform.features?.poolPriceThb || 3000;
    const load = React.useCallback(async () => {
      const client = await getClient(); setSb(client);
      const { data, error } = await client.rpc('get_meow_pool');
      if (error) setMsg({ tone: 'error', text: friendlyError(error) }); else setRows(data || []);
    }, []);
    React.useEffect(() => {
      if (!platform.user) return;
      (async () => {
        const params = new URLSearchParams(location.search);
        if (params.get('pool') === 'success' && params.get('session_id')) {
          try { await api('/api/stripe/confirm', { method: 'POST', body: { session_id: params.get('session_id') } }); setMsg({ tone: 'good', text: 'Payment received. Welcome to this month’s Meow Pool!' }); }
          catch (e) { setMsg({ tone: 'warn', text: 'Payment is still processing: ' + e.message }); }
          history.replaceState(null, '', location.pathname);
        } else if (params.get('pool') === 'cancelled') { setMsg({ tone: 'warn', text: 'Checkout cancelled. No payment was taken.' }); history.replaceState(null, '', location.pathname); }
        load();
      })();
    }, [platform.user?.id]);
    const buy = async () => {
      setBusy(true); setMsg(null);
      try { const r = await api('/api/stripe/checkout', { method: 'POST', body: {} }); if (r.alreadyPaid) { setMsg({ tone: 'good', text: 'You already have access this month.' }); load(); } else location.assign(r.url); }
      catch (e) { setMsg({ tone: 'error', text: e.code === 'not_configured' ? 'Payments aren’t set up yet (add STRIPE_SECRET_KEY).' : e.message }); }
      finally { setBusy(false); }
    };
    const unlocked = rows?.[0]?.unlocked;
    const month = rows?.[0]?.month ? new Date(rows[0].month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return h('div', { className: 'pf-stack' },
      h('div', { className: 'pf-card pf-pool-hero' },
        h('div', null, h('p', { className: 'lab-kicker' }, '⭐ Meow Pool · ' + month),
          h('h2', null, 'Bangkok’s top 50 international students, hand-picked.'),
          h('p', { className: 'pf-muted' }, `Every month HireMeow curates 50 students with a video pitch and MeowScore. Companies get early access for ${baht(price)}.`)),
        !platform.user ? h('button', { type: 'button', className: 'lab-btn', onClick: onOpenAuth }, 'Sign in to view')
        : role === 'company' && !unlocked ? h('button', { type: 'button', className: 'lab-btn', onClick: buy, disabled: busy }, busy ? 'Opening Stripe…' : `Get early access · ${baht(price)}`)
        : role === 'admin' ? h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => onNavigate('admin') }, 'Curate the pool →')
        : role === 'student' ? h('p', { className: 'pf-muted' }, platform.profile.is_meow_pool_top50 ? 'You’re in this month’s pool! 🎉' : 'Keep improving your MeowScore, badges and pitch to be selected.')
        : unlocked && h('span', { className: 'pf-status pf-status-accepted' }, 'Access active')),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      role === 'company' && !unlocked && h('p', { className: 'lab-tiny' }, 'Stripe test mode: use card 4242 4242 4242 4242, any future date and any CVC.'),
      platform.user && (rows === null ? h('p', null, 'Loading…') : !rows.length ? h(ui.Empty, { icon: '🐾' }, 'This month’s pool hasn’t been curated yet.') :
        h('div', { className: 'pf-pool-wrap' },
          h('div', { className: 'demo-pool pf-pool' + (unlocked ? '' : ' pf-teaser') }, ...rows.map((r, i) => h('article', { key: r.student_id || i, className: 'demo-student' },
            unlocked && r.pitch_path ? h(ui.VideoPlayer, { path: r.pitch_path, sb }) : h('div', { className: 'demo-video', 'aria-hidden': true }, unlocked ? 'No video' : '🔒'),
            h('strong', null, r.display_name), h('small', null, [r.field_of_study, r.university].filter(Boolean).join(' · ')), r.nationality && h('small', null, r.nationality),
            h('div', { className: 'demo-row demo-between' }, r.meow_score != null ? h('span', { className: 'demo-score' }, r.meow_score) : h('span', null), h('small', null, `${r.badge_count || 0} badge${r.badge_count === 1 ? '' : 's'}`)),
            r.dna_type && h('small', null, '🧬 ' + r.dna_type)))),
          !unlocked && h('p', { className: 'pf-muted pf-center' }, `${rows.length} students this month. ${role === 'company' ? 'Unlock names, profiles and pitch videos.' : 'Full profiles are visible to partner companies.'}`))));
  }

  function AdminPanel({ platform }) {
    const [sb, setSb] = React.useState(null);
    const [students, setStudents] = React.useState([]);
    const [companies, setCompanies] = React.useState([]);
    const [outbox, setOutbox] = React.useState([]);
    const [q, setQ] = React.useState('');
    const [msg, setMsg] = React.useState(null);
    const [running, setRunning] = React.useState('');
    const load = React.useCallback(async () => {
      const client = await getClient(); setSb(client);
      const [s, c, o] = await Promise.all([
        client.from('profiles').select('id,full_name,university,field_of_study,meow_score,is_meow_pool_top50,open_to_offers,pitch_video_id,badges').eq('role', 'student').order('meow_score', { ascending: false, nullsFirst: false }).limit(500),
        client.from('companies').select('id,name,company_health,health_note,health_locked,health_checked_at,response_rate').order('name'),
        client.from('email_outbox').select('*').order('created_at', { ascending: false }).limit(20)
      ]);
      setStudents(s.data || []); setCompanies(c.data || []); setOutbox(o.data || []);
    }, []);
    React.useEffect(() => { load(); }, [load]);
    if (platform.profile?.role !== 'admin') return h(ui.Notice, { tone: 'error' }, 'Admins only.');
    const poolCount = students.filter(s => s.is_meow_pool_top50).length;
    const togglePool = async s => {
      const { error } = await sb.from('profiles').update({ is_meow_pool_top50: !s.is_meow_pool_top50 }).eq('id', s.id);
      setMsg(error ? { tone: 'error', text: friendlyError(error) } : null); load();
    };
    const setHealth = async (c, patch) => { const { error } = await sb.from('companies').update(patch).eq('id', c.id); if (error) setMsg({ tone: 'error', text: friendlyError(error) }); load(); };
    const run = async job => {
      setRunning(job); setMsg(null);
      try { const r = await api('/api/cron/' + job); setMsg({ tone: 'good', text: job === 'ghosting' ? `Ghosting check done: ${r.nudged} reminder${r.nudged === 1 ? '' : 's'} sent (mock email).` : `Layoff Radar refreshed ${r.checked} companies (${r.green} green, ${r.yellow} yellow, ${r.red} red) using ${r.provider} news.` }); load(); }
      catch (e) { setMsg({ tone: 'error', text: e.message }); } finally { setRunning(''); }
    };
    const shown = students.filter(s => !q || `${s.full_name} ${s.university} ${s.field_of_study}`.toLowerCase().includes(q.toLowerCase()));
    const jobsCard = h('div', { className: 'pf-card' },
      h('h3', null, 'Scheduled jobs'),
      h('p', { className: 'pf-muted' }, 'On Vercel these run daily via Cron. Run them now to test.'),
      h('div', { className: 'lab-row' },
        h('button', { type: 'button', className: 'lab-btn', disabled: !!running, onClick: () => run('ghosting') }, running === 'ghosting' ? 'Running…' : '⏰ Run Ghosting Protection'),
        h('button', { type: 'button', className: 'lab-btn', disabled: !!running, onClick: () => run('company-health') }, running === 'company-health' ? 'Running…' : '📡 Run Layoff Radar')));

    const studentRow = s => h('tr', { key: s.id },
      h('td', null, h('strong', null, s.full_name || '(no name)'), h('br'), h('small', null, [s.field_of_study, s.university].filter(Boolean).join(' · '))),
      h('td', null, s.meow_score ?? '—'),
      h('td', null, Array.isArray(s.badges) ? s.badges.length : 0),
      h('td', null, s.pitch_video_id ? '🎬' : '—'),
      h('td', null, s.open_to_offers ? '✅' : '—'),
      h('td', null,
        h('label', { className: 'demo-toggle', htmlFor: 'pool-' + s.id },
          h('input', { type: 'checkbox', role: 'switch', id: 'pool-' + s.id, checked: s.is_meow_pool_top50, disabled: !s.is_meow_pool_top50 && poolCount >= 50, onChange: () => togglePool(s) }),
          h('span', { className: 'demo-switch', 'aria-hidden': true }),
          h('span', { className: 'hm-visually-hidden' }, 'In Meow Pool'))));
    const poolCard = h('div', { className: 'pf-card' },
      h('div', { className: 'lab-row lab-between' },
        h('h3', null, `Meow Pool curation · ${poolCount}/50 this month`),
        h(ui.Input, { id: 'adm-q', type: 'search', value: q, onChange: setQ, placeholder: 'Filter students', 'aria-label': 'Filter students' })),
      h('div', { className: 'demo-table-wrap' },
        h('table', { className: 'demo-table' },
          h('thead', null, h('tr', null, ...['Student', 'MeowScore', 'Badges', 'Pitch', 'Open', 'Top 50'].map(t => h('th', { key: t }, t)))),
          h('tbody', null, ...shown.map(studentRow)))));

    const companyRow = c => h('tr', { key: c.id },
      h('td', null, c.name),
      h('td', null, h(ui.Select, { id: 'hl-' + c.id, value: c.company_health, onChange: v => setHealth(c, { company_health: v, health_locked: true }), options: [['green', '🟢 Green'], ['yellow', '🟡 Yellow'], ['red', '🔴 Red']] })),
      h('td', null, h('small', null, c.health_note || '—'), c.health_checked_at && h('small', { className: 'pf-block' }, fmtDate(c.health_checked_at))),
      h('td', null, Math.round(c.response_rate) + '%'),
      h('td', null, h('input', { type: 'checkbox', 'aria-label': 'Lock health for ' + c.name, checked: c.health_locked, onChange: e => setHealth(c, { health_locked: e.target.checked }) })));
    const healthCard = h('div', { className: 'pf-card' },
      h('h3', null, 'Layoff Radar · company health'),
      h('p', { className: 'lab-tiny' }, 'Changing a colour locks it so the daily news check won’t overwrite it.'),
      h('div', { className: 'demo-table-wrap' },
        h('table', { className: 'demo-table' },
          h('thead', null, h('tr', null, ...['Company', 'Health', 'Latest signal', 'Replies', 'Manual lock'].map(t => h('th', { key: t }, t)))),
          h('tbody', null, ...companies.map(companyRow)))));

    const outboxCard = h('div', { className: 'pf-card' },
      h('h3', null, 'Mock email outbox (Ghosting Protection)'),
      !outbox.length ? h('p', { className: 'pf-muted' }, 'No reminders yet.') :
        h('ul', { className: 'pf-list' }, ...outbox.map(m => h('li', { key: m.id, className: 'pf-row' },
          h('div', null, h('strong', null, m.subject), h('small', null, `to ${m.to_email || '(no email)'} · ${fmtDate(m.created_at)}`), h('p', { className: 'lab-tiny' }, m.body)),
          h('span', { className: 'pf-status' }, m.status)))));

    return h('div', { className: 'pf-stack' }, msg && h(ui.Notice, { tone: msg.tone }, msg.text), jobsCard, poolCard, healthCard, outboxCard);
  }

  return { MeowPool, AdminPanel };
}
