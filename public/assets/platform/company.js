// Company dashboard: profile + map pin, jobs (Salary Wall), applicants pipeline, Reverse Hiring.
import { getClient, friendlyError, fmtDate, baht, refreshProfile } from './client.js';
import { stationNames } from './stations.js';

const EMPTY_JOB = { title: '', description: '', employment_type: 'full_time', location: '', bts_station: '', mrt_station: '', remote_ok: false, salary_min: '', salary_max: '', lat: null, lng: null };
const PIPELINE = ['applied', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected'];
const INDUSTRIES = ['Tech', 'Business', 'Manufacturing', 'Hospitality', 'Education', 'Healthcare', 'Finance', 'Startup'];
const clean = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, v === null ? (k === 'lat' || k === 'lng' ? null : '') : v]));
const num = v => (v === '' || v === null || v === undefined ? null : Math.round(Number(v)));

export function createCompany(React, ui, maps, jobsMod) {
  const h = React.createElement;
  const BTS = stationNames('BTS'), MRT = stationNames('MRT');

  function CompanyForm({ company, userId, onSaved }) {
    const [f, setF] = React.useState(() => ({ name: '', industry: '', website: '', description: '', contact_email: '', address: '', bts_station: '', mrt_station: '', sponsors_visa: false, boi_promoted: false, lat: null, lng: null, ...clean(company) }));
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const set = k => v => setF(prev => ({ ...prev, [k]: v }));
    const save = async e => {
      e.preventDefault(); setBusy(true); setMsg(null);
      try {
        const sb = await getClient();
        const row = { name: f.name.trim(), industry: f.industry || null, website: f.website.trim() || null, description: f.description.trim() || null, contact_email: f.contact_email.trim() || null, address: f.address.trim() || null, bts_station: f.bts_station || null, mrt_station: f.mrt_station || null, sponsors_visa: f.sponsors_visa, boi_promoted: f.boi_promoted, lat: f.lat, lng: f.lng };
        const q = company ? sb.from('companies').update(row).eq('id', company.id).select().single() : sb.from('companies').insert({ ...row, owner_id: userId }).select().single();
        const { data, error } = await q; if (error) throw error;
        setMsg({ tone: 'good', text: 'Company profile saved.' }); onSaved(data);
      } catch (err) { setMsg({ tone: 'error', text: friendlyError(err) }); } finally { setBusy(false); }
    };
    return h('form', { className: 'pf-card pf-form', onSubmit: save },
      h('h3', null, company ? 'Company profile' : 'Create your company profile'),
      h('div', { className: 'pd-grid' },
        h(ui.Field, { id: 'co-name', label: 'Company name' }, h(ui.Input, { id: 'co-name', value: f.name, onChange: set('name'), required: true, minLength: 2, maxLength: 120 })),
        h(ui.Field, { id: 'co-industry', label: 'Industry' }, h(ui.Select, { id: 'co-industry', value: f.industry, onChange: set('industry'), options: INDUSTRIES, placeholder: 'Choose…' })),
        h(ui.Field, { id: 'co-web', label: 'Website' }, h(ui.Input, { id: 'co-web', type: 'url', value: f.website, onChange: set('website'), placeholder: 'https://' })),
        h(ui.Field, { id: 'co-email', label: 'Hiring email', hint: 'Ghosting reminders go here.' }, h(ui.Input, { id: 'co-email', type: 'email', value: f.contact_email, onChange: set('contact_email') })),
        h(ui.Field, { id: 'co-bts', label: 'Nearest BTS' }, h(ui.Select, { id: 'co-bts', value: f.bts_station, onChange: set('bts_station'), options: BTS, placeholder: 'None' })),
        h(ui.Field, { id: 'co-mrt', label: 'Nearest MRT' }, h(ui.Select, { id: 'co-mrt', value: f.mrt_station, onChange: set('mrt_station'), options: MRT, placeholder: 'None' })),
        h(ui.Field, { id: 'co-address', label: 'Address' }, h(ui.Input, { id: 'co-address', value: f.address, onChange: set('address') }))),
      h(ui.Field, { id: 'co-desc', label: 'About the company' }, h(ui.TextArea, { id: 'co-desc', value: f.description, onChange: set('description'), rows: 3, maxLength: 2000 })),
      h('div', { className: 'lab-row' },
        h('label', { className: 'demo-check', htmlFor: 'co-visa' }, h('input', { type: 'checkbox', id: 'co-visa', checked: f.sponsors_visa, onChange: e => set('sponsors_visa')(e.target.checked) }), 'We support Non-B visas and work permits'),
        h('label', { className: 'demo-check', htmlFor: 'co-boi' }, h('input', { type: 'checkbox', id: 'co-boi', checked: f.boi_promoted, onChange: e => set('boi_promoted')(e.target.checked) }), 'BOI-promoted')),
      h('p', { className: 'lab-label' }, 'Office location'),
      h(maps.PinPicker, { value: { lat: f.lat, lng: f.lng }, onChange: pos => setF(prev => ({ ...prev, ...pos })) }),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      h('button', { type: 'submit', className: 'lab-btn', disabled: busy }, busy ? 'Saving…' : 'Save company'));
  }

  function JobEditor({ company, job, onSaved, onCancel }) {
    const [f, setF] = React.useState(() => ({ ...EMPTY_JOB, ...clean(job) }));
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const set = k => v => setF(prev => ({ ...prev, [k]: v }));
    const hasSalary = Number(f.salary_min) > 0 && Number(f.salary_max) > 0;
    const orderOk = !hasSalary || Number(f.salary_max) >= Number(f.salary_min);
    const save = async status => {
      setBusy(true); setMsg(null);
      try {
        if (!f.title.trim()) throw new Error('Add a job title.');
        if (status === 'published' && !hasSalary) throw new Error('Hiding Treats 🐟: add a salary range before publishing.');
        if (!orderOk) throw new Error('The maximum salary must be at least the minimum.');
        const sb = await getClient();
        const row = { company_id: company.id, title: f.title.trim(), description: f.description.trim() || null, employment_type: f.employment_type, location: f.location.trim() || null, bts_station: f.bts_station || null, mrt_station: f.mrt_station || null, remote_ok: f.remote_ok, salary_min: num(f.salary_min), salary_max: num(f.salary_max), lat: f.lat, lng: f.lng, status };
        const q = job?.id ? sb.from('jobs').update(row).eq('id', job.id).select().single() : sb.from('jobs').insert(row).select().single();
        const { data, error } = await q; if (error) throw error;
        onSaved(data, status === 'published' ? 'Published! It’s live on the Jobs board.' : 'Saved as draft.');
      } catch (err) { setMsg({ tone: 'error', text: friendlyError(err) }); } finally { setBusy(false); }
    };
    return h('form', { className: 'pf-card pf-form', onSubmit: e => { e.preventDefault(); save('published'); } },
      h('div', { className: 'lab-row lab-between' }, h('h3', null, job?.id ? 'Edit job' : 'Post a job'), h(ui.Salary, { min: hasSalary && f.salary_min, max: hasSalary && f.salary_max })),
      h('div', { className: 'pd-grid' },
        h(ui.Field, { id: 'job-title', label: 'Job title' }, h(ui.Input, { id: 'job-title', value: f.title, onChange: set('title'), required: true, maxLength: 140 })),
        h(ui.Field, { id: 'job-type', label: 'Type' }, h(ui.Select, { id: 'job-type', value: f.employment_type, onChange: set('employment_type'), options: jobsMod.TYPES })),
        h(ui.Field, { id: 'job-min', label: 'Salary from (THB / month)' }, h(ui.Input, { id: 'job-min', type: 'number', min: 1, value: f.salary_min, onChange: set('salary_min'), placeholder: 'e.g. 25000' })),
        h(ui.Field, { id: 'job-max', label: 'Salary to (THB / month)' }, h(ui.Input, { id: 'job-max', type: 'number', min: 1, value: f.salary_max, onChange: set('salary_max'), placeholder: 'e.g. 32000' })),
        h(ui.Field, { id: 'job-loc', label: 'Location' }, h(ui.Input, { id: 'job-loc', value: f.location, onChange: set('location'), placeholder: company.address || 'e.g. Sukhumvit, Bangkok' })),
        h(ui.Field, { id: 'job-bts', label: 'BTS station' }, h(ui.Select, { id: 'job-bts', value: f.bts_station, onChange: set('bts_station'), options: BTS, placeholder: company.bts_station ? `Company default: ${company.bts_station}` : 'None' })),
        h(ui.Field, { id: 'job-mrt', label: 'MRT station' }, h(ui.Select, { id: 'job-mrt', value: f.mrt_station, onChange: set('mrt_station'), options: MRT, placeholder: company.mrt_station ? `Company default: ${company.mrt_station}` : 'None' }))),
      h(ui.Field, { id: 'job-desc', label: 'Description' }, h(ui.TextArea, { id: 'job-desc', value: f.description, onChange: set('description'), rows: 5, maxLength: 6000 })),
      h('label', { className: 'demo-check', htmlFor: 'job-remote' }, h('input', { type: 'checkbox', id: 'job-remote', checked: f.remote_ok, onChange: e => set('remote_ok')(e.target.checked) }), 'Remote work possible'),
      h('details', null, h('summary', null, 'Pin a different location for this job (optional)'), h(maps.PinPicker, { value: { lat: f.lat, lng: f.lng }, onChange: pos => setF(prev => ({ ...prev, ...pos })) })),
      !hasSalary && h(ui.Notice, { tone: 'warn' }, h('strong', null, 'Hiding Treats 🐟 '), 'HireMeow only publishes jobs with a salary range. You can still save a draft.'),
      !orderOk && h(ui.Notice, { tone: 'error' }, 'The maximum salary must be at least the minimum.'),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      h('div', { className: 'lab-row' },
        h('button', { type: 'submit', className: 'lab-btn', disabled: busy || !hasSalary || !orderOk, title: hasSalary ? undefined : 'Add a salary range to publish' }, 'Publish'),
        h('button', { type: 'button', className: 'lab-btn-ghost', disabled: busy, onClick: () => save('draft') }, 'Save draft'),
        job?.status === 'published' && h('button', { type: 'button', className: 'lab-btn-ghost', disabled: busy, onClick: () => save('closed') }, 'Close job'),
        h('button', { type: 'button', className: 'lab-btn-ghost', onClick: onCancel }, 'Cancel')));
  }

  function Applicants({ company, jobs, sb }) {
    const [apps, setApps] = React.useState(null);
    const [filter, setFilter] = React.useState('');
    const [msg, setMsg] = React.useState(null);
    const load = React.useCallback(async () => {
      if (!jobs.length) { setApps([]); return; }
      const { data, error } = await sb.from('applications')
        .select('id,status,cover_note,created_at,ghosting_last_reply_at,nudge_count,job_id,student_id,profiles:student_id(full_name,university,field_of_study,nationality,meow_score,dna_type,badges),video_pitches:video_pitch_id(storage_path,duration_seconds)')
        .in('job_id', jobs.map(j => j.id)).order('created_at', { ascending: false });
      if (error) setMsg({ tone: 'error', text: friendlyError(error) }); else setApps(data);
    }, [jobs.map(j => j.id).join()]);
    React.useEffect(() => { load(); }, [load]);
    const move = async (a, status) => {
      const { error } = await sb.from('applications').update({ status }).eq('id', a.id);
      if (error) setMsg({ tone: 'error', text: friendlyError(error) }); else { setMsg({ tone: 'good', text: `Moved to ${status}. The student sees it on their timeline.` }); load(); }
    };
    const title = id => jobs.find(j => j.id === id)?.title || 'Job';
    const days = a => Math.floor((Date.now() - new Date(a.ghosting_last_reply_at || a.created_at)) / 86400000);
    const list = (apps || []).filter(a => !filter || a.job_id === filter);
    return h('section', { className: 'pf-card', 'aria-labelledby': 'apps-title' },
      h('div', { className: 'lab-row lab-between' }, h('h3', { id: 'apps-title' }, 'Applicants'),
        h(ui.Select, { id: 'apps-filter', value: filter, onChange: setFilter, options: jobs.map(j => [j.id, j.title]), placeholder: 'All jobs' })),
      h('p', { className: 'lab-tiny' }, 'Ghosting Protection: reply within 5 days (any status change counts). Silent applications trigger an automatic reminder and lower your response rate.'),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      apps === null ? h('p', null, 'Loading…') : !list.length ? h(ui.Empty, { icon: '📭' }, 'No applications yet.') :
      h('ul', { className: 'pf-list' }, ...list.map(a => {
        const p = a.profiles || {};
        const waiting = ['applied', 'viewed', 'shortlisted', 'interview'].includes(a.status) ? days(a) : 0;
        return h('li', { key: a.id, className: 'pf-applicant' },
          h('div', { className: 'pf-applicant-main' },
            h('strong', null, p.full_name || 'Student'), h('small', null, [p.field_of_study, p.university, p.nationality].filter(Boolean).join(' · ')),
            h('small', null, `${title(a.job_id)} · applied ${fmtDate(a.created_at)}`),
            h('div', { className: 'pf-chips' },
              p.meow_score != null && h('span', { className: 'pf-chip pf-chip-strong' }, `MeowScore ${p.meow_score}`),
              p.dna_type && h('span', { className: 'pf-chip' }, '🧬 ' + p.dna_type),
              Array.isArray(p.badges) && p.badges.length > 0 && h('span', { className: 'pf-chip' }, `${p.badges.length} badge${p.badges.length === 1 ? '' : 's'}`),
              waiting >= 5 && h('span', { className: 'pf-chip pf-chip-bad' }, `⏰ waiting ${waiting} days`),
              waiting >= 3 && waiting < 5 && h('span', { className: 'pf-chip pf-chip-warn' }, `Reply within ${5 - waiting} day${5 - waiting === 1 ? '' : 's'}`)),
            a.cover_note && h('p', { className: 'pf-pre' }, a.cover_note),
            a.video_pitches?.storage_path && h(ui.VideoPlayer, { path: a.video_pitches.storage_path, sb })),
          h(ui.Field, { id: 'st-' + a.id, label: 'Status' },
            a.status === 'withdrawn' ? h('span', { className: 'pf-muted' }, 'Withdrawn') :
            h(ui.Select, { id: 'st-' + a.id, value: a.status, onChange: v => move(a, v), options: PIPELINE.map(s => [s, ui.label(s)]) })));
      })));
  }

  function ReverseHiring({ company, jobs, sb }) {
    const [students, setStudents] = React.useState(null);
    const [offers, setOffers] = React.useState([]);
    const [search, setSearch] = React.useState('');
    const [industry, setIndustry] = React.useState('');
    const [target, setTarget] = React.useState(null);
    const [draft, setDraft] = React.useState({ title: '', salary_min: '', salary_max: '', message: '', job_id: '' });
    const [msg, setMsg] = React.useState(null);
    const load = React.useCallback(async () => {
      const [{ data, error }, { data: sent }] = await Promise.all([
        sb.rpc('browse_open_students', { p_industry: industry || null, p_search: search.trim() || null }),
        sb.from('offers').select('id,title,salary_min,salary_max,status,created_at,responded_at,student_id,profiles:student_id(full_name)').eq('company_id', company.id).order('created_at', { ascending: false })
      ]);
      if (error) setMsg({ tone: 'error', text: friendlyError(error) });
      setStudents(data || []); setOffers(sent || []);
    }, [industry, search, company.id]);
    React.useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
    const send = async e => {
      e.preventDefault(); setMsg(null);
      const min = num(draft.salary_min), max = num(draft.salary_max);
      if (!(min > 0 && max >= min)) { setMsg({ tone: 'error', text: 'Reverse Hiring offers must show a salary range (max ≥ min).' }); return; }
      const job = jobs.find(j => j.id === draft.job_id);
      const { error } = await sb.from('offers').insert({ company_id: company.id, student_id: target.id, job_id: draft.job_id || null, title: draft.title.trim() || job?.title, salary_min: min, salary_max: max, message: draft.message.trim() || null });
      if (error) setMsg({ tone: 'error', text: friendlyError(error) });
      else { setMsg({ tone: 'good', text: `Offer sent to ${target.full_name || 'the student'}.` }); setTarget(null); load(); }
    };
    const pending = new Set(offers.filter(o => o.status === 'pending').map(o => o.student_id));
    return h('section', { className: 'pf-stack', 'aria-labelledby': 'rh-title' },
      h('div', { className: 'pf-card' },
        h('h3', { id: 'rh-title' }, 'Reverse Hiring · students open to offers'),
        h('p', { className: 'pf-muted' }, 'These students switched on “Open to offers”. Send a “We want to hire you” offer with the salary up front.'),
        h('div', { className: 'lab-row' },
          h(ui.Input, { id: 'rh-search', type: 'search', value: search, onChange: setSearch, placeholder: 'Search skills, major, university…', 'aria-label': 'Search students' }),
          h(ui.Select, { id: 'rh-industry', value: industry, onChange: setIndustry, options: INDUSTRIES, placeholder: 'Any industry' })),
        msg && h(ui.Notice, { tone: msg.tone }, msg.text),
        students === null ? h('p', null, 'Loading…') : !students.length ? h(ui.Empty, { icon: '🙀' }, 'No students match right now.') :
        h('div', { className: 'pf-student-grid' }, ...students.map(s => h('article', { key: s.id, className: 'pf-student' },
          h('div', { className: 'lab-row lab-between' }, h('strong', null, s.full_name || 'Student'), s.meow_score != null && h('span', { className: 'demo-score' }, s.meow_score)),
          h('small', null, [s.field_of_study, s.university, s.grad_year].filter(Boolean).join(' · ')),
          s.headline && h('p', null, s.headline),
          h('div', { className: 'pf-chips' },
            s.dna_type && h('span', { className: 'pf-chip' }, '🧬 ' + s.dna_type),
            s.home_bts_station && h('span', { className: 'pf-chip' }, '🚆 ' + s.home_bts_station),
            s.desired_salary_min && h('span', { className: 'pf-chip' }, 'Wants ' + baht(s.desired_salary_min) + '+'),
            ...(s.skills || []).slice(0, 4).map(k => h('span', { key: k, className: 'pf-chip' }, k))),
          s.pitch_path && h(ui.VideoPlayer, { path: s.pitch_path, sb }),
          pending.has(s.id) ? h('span', { className: 'pf-muted' }, 'Offer pending') :
          h('button', { type: 'button', className: 'lab-btn', onClick: () => { setTarget(s); setDraft({ title: '', salary_min: s.desired_salary_min || '', salary_max: '', message: '', job_id: '' }); } }, 'We want to hire you'))))),
      target && h('form', { className: 'pf-card pf-form', onSubmit: send },
        h('h3', null, 'Offer for ' + (target.full_name || 'student')),
        h('div', { className: 'pd-grid' },
          h(ui.Field, { id: 'of-job', label: 'Linked job (optional)' }, h(ui.Select, { id: 'of-job', value: draft.job_id, onChange: v => setDraft(d => ({ ...d, job_id: v, title: d.title || jobs.find(j => j.id === v)?.title || '', salary_min: d.salary_min || jobs.find(j => j.id === v)?.salary_min || '', salary_max: d.salary_max || jobs.find(j => j.id === v)?.salary_max || '' })), options: jobs.map(j => [j.id, j.title]), placeholder: 'None' })),
          h(ui.Field, { id: 'of-title', label: 'Role' }, h(ui.Input, { id: 'of-title', value: draft.title, onChange: v => setDraft(d => ({ ...d, title: v })), required: true, maxLength: 140 })),
          h(ui.Field, { id: 'of-min', label: 'Salary from (THB)' }, h(ui.Input, { id: 'of-min', type: 'number', min: 1, value: draft.salary_min, onChange: v => setDraft(d => ({ ...d, salary_min: v })), required: true })),
          h(ui.Field, { id: 'of-max', label: 'Salary to (THB)' }, h(ui.Input, { id: 'of-max', type: 'number', min: 1, value: draft.salary_max, onChange: v => setDraft(d => ({ ...d, salary_max: v })), required: true }))),
        h(ui.Field, { id: 'of-msg', label: 'Message' }, h(ui.TextArea, { id: 'of-msg', rows: 3, maxLength: 1500, value: draft.message, onChange: v => setDraft(d => ({ ...d, message: v })), placeholder: 'Why you’d love them on your team…' })),
        h('div', { className: 'lab-row' }, h('button', { type: 'submit', className: 'lab-btn' }, 'Send offer'), h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => setTarget(null) }, 'Cancel'))),
      h('div', { className: 'pf-card' }, h('h3', null, 'Offers you sent'),
        !offers.length ? h('p', { className: 'pf-muted' }, 'None yet.') :
        h('ul', { className: 'pf-list' }, ...offers.map(o => h('li', { key: o.id, className: 'pf-row' },
          h('div', null, h('strong', null, `${o.title} → ${o.profiles?.full_name || 'Student'}`), h('small', null, `${baht(o.salary_min)} – ${baht(o.salary_max)} · sent ${fmtDate(o.created_at)}`)),
          h('span', { className: 'pf-status pf-status-' + o.status }, ui.label(o.status)),
          o.status === 'pending' && h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: async () => { await sb.from('offers').update({ status: 'withdrawn' }).eq('id', o.id); load(); } }, 'Withdraw'))))));
  }

  function CompanyDashboard({ platform, onNavigate }) {
    const [sb, setSb] = React.useState(null);
    const [company, setCompany] = React.useState(undefined);
    const [jobs, setJobs] = React.useState([]);
    const [tab, setTab] = React.useState('jobs');
    const [editing, setEditing] = React.useState(null);
    const [msg, setMsg] = React.useState(null);
    const load = React.useCallback(async () => {
      const client = await getClient(); setSb(client);
      const { data } = await client.from('companies').select('*').eq('owner_id', platform.user.id).maybeSingle();
      setCompany(data || null);
      if (data) { const { data: js } = await client.from('jobs').select('*').eq('company_id', data.id).order('created_at', { ascending: false }); setJobs(js || []); }
    }, [platform.user.id]);
    React.useEffect(() => { load(); }, [load]);
    if (company === undefined) return h('p', null, 'Loading your company…');
    if (!company) return h(CompanyForm, { userId: platform.user.id, onSaved: c => { setCompany(c); refreshProfile(); } });
    const tabs = [['jobs', `Jobs (${jobs.length})`], ['applicants', 'Applicants'], ['talent', 'Reverse Hiring'], ['profile', 'Company profile']];
    return h('div', { className: 'pf-stack' },
      h('div', { className: 'pf-card pf-company-head' },
        h('div', null, h('h2', null, company.name), h('p', { className: 'pf-muted' }, [company.industry, company.bts_station && 'BTS ' + company.bts_station, company.mrt_station && 'MRT ' + company.mrt_station].filter(Boolean).join(' · '))),
        h('div', { className: 'pf-chips' }, h(ui.HealthPaw, { health: company.company_health, note: company.health_note }), h(ui.ReplyRate, { rate: company.response_rate, days: company.avg_reply_days })),
        company.health_note && h('p', { className: 'lab-tiny' }, 'Layoff Radar: ' + company.health_note)),
      h('div', { className: 'lab-tabs', role: 'tablist' }, ...tabs.map(([id, t]) => h('button', { key: id, role: 'tab', 'aria-selected': tab === id, className: tab === id ? 'on' : '', onClick: () => { setTab(id); setEditing(null); } }, t)),
        h('button', { type: 'button', onClick: () => onNavigate('pool') }, '⭐ Meow Pool')),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      tab === 'jobs' && (editing ? h(JobEditor, { company, job: editing === 'new' ? null : editing, onCancel: () => setEditing(null), onSaved: (_, text) => { setEditing(null); setMsg({ tone: 'good', text }); load(); } }) :
        h('div', { className: 'pf-card' },
          h('div', { className: 'lab-row lab-between' }, h('h3', null, 'Your jobs'), h('button', { type: 'button', className: 'lab-btn', onClick: () => { setMsg(null); setEditing('new'); } }, '+ Post a job')),
          !jobs.length ? h(ui.Empty, { icon: '📝' }, 'No jobs yet. Post your first one. Remember: salary range required.') :
          h('ul', { className: 'pf-list' }, ...jobs.map(j => h('li', { key: j.id, className: 'pf-row' },
            h('div', null, h('strong', null, j.title), h('small', null, `${jobsMod.typeLabel(j.employment_type)} · ${j.bts_station ? 'BTS ' + j.bts_station : j.mrt_station ? 'MRT ' + j.mrt_station : j.location || 'No station'}`)),
            h(ui.Salary, { min: j.salary_min, max: j.salary_max, compact: true }),
            h('span', { className: 'pf-status pf-status-' + j.status }, ui.label(j.status)),
            h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => setEditing(j) }, 'Edit')))))),
      tab === 'applicants' && sb && h(Applicants, { company, jobs, sb }),
      tab === 'talent' && sb && h(ReverseHiring, { company, jobs, sb }),
      tab === 'profile' && h(CompanyForm, { company, userId: platform.user.id, onSaved: c => { setCompany(c); setMsg({ tone: 'good', text: 'Saved.' }); } }));
  }

  return { CompanyDashboard };
}
