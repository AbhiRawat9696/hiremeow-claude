// Jobs board: Salary Transparency Wall, BTS/MRT + distance filter, map, apply with video pitch.
import { getClient, friendlyError, fmtDate } from './client.js';
import { stationNames, stopsBetween, haversineKm } from './stations.js';

const TYPES = [['full_time', 'Full-time'], ['part_time', 'Part-time'], ['internship', 'Internship'], ['contract', 'Contract']];
const typeLabel = t => (TYPES.find(x => x[0] === t) || [t, t])[1];

export function createJobs(React, ui, maps, studio) {
  const h = React.createElement;

  function ApplyForm({ job, platform, onDone, onOpenAuth }) {
    const [note, setNote] = React.useState('');
    const [withPitch, setWithPitch] = React.useState(true);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const p = platform.profile;
    if (!platform.user) return h('div', { className: 'pf-apply' }, h('p', null, 'Sign in as a student to apply.'), h('button', { type: 'button', className: 'lab-btn', onClick: onOpenAuth }, 'Sign in'));
    if (p?.role !== 'student') return h('p', { className: 'pf-muted' }, 'Only student accounts can apply.');
    const submit = async e => {
      e.preventDefault(); setBusy(true); setMsg(null);
      try {
        const sb = await getClient();
        const { error } = await sb.from('applications').insert({ job_id: job.id, student_id: platform.user.id, cover_note: note.trim() || null, video_pitch_id: withPitch ? p.pitch_video_id : null });
        if (error) throw error;
        setMsg({ tone: 'good', text: 'Applied! Track it under My profile → Applications.' }); onDone?.();
      } catch (err) { setMsg({ tone: 'error', text: friendlyError(err) }); } finally { setBusy(false); }
    };
    return h('form', { className: 'pf-apply', onSubmit: submit },
      h(ui.Field, { id: 'apply-note-' + job.id, label: 'Short note (optional)', hint: 'No cover letter needed. Your 1-Minute Meow Pitch does the talking.' },
        h(ui.TextArea, { id: 'apply-note-' + job.id, value: note, onChange: setNote, rows: 3, maxLength: 1500 })),
      p.pitch_video_id
        ? h('label', { className: 'demo-check', htmlFor: 'apply-pitch-' + job.id }, h('input', { type: 'checkbox', id: 'apply-pitch-' + job.id, checked: withPitch, onChange: e => setWithPitch(e.target.checked) }), 'Attach my 60-second pitch video')
        : h('p', { className: 'lab-tiny' }, 'Tip: record your 1-Minute Meow Pitch in My profile to stand out.'),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      h('button', { type: 'submit', className: 'lab-btn', disabled: busy || msg?.tone === 'good' }, busy ? 'Sending…' : 'Apply now'));
  }

  function JobCard({ job, platform, applied, distance, selected, onSelect, onApplied, onOpenAuth, onNavigate }) {
    const c = job.companies || {};
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { if (selected) setOpen(true); }, [selected]);
    return h('article', { className: 'pf-job' + (selected ? ' is-selected' : ''), id: 'job-' + job.id },
      h('div', { className: 'pf-job-top' },
        h('div', null,
          h('h3', null, h('button', { type: 'button', className: 'pf-link-title', onClick: () => { setOpen(!open); onSelect(job.id); }, 'aria-expanded': open }, job.title)),
          h('p', { className: 'pf-muted' }, [c.name, typeLabel(job.employment_type), job.location].filter(Boolean).join(' · '))),
        h(ui.Salary, { min: job.salary_min, max: job.salary_max })),
      h('div', { className: 'pf-chips' },
        job.bts_station && h('span', { className: 'pf-chip' }, '🚆 BTS ' + job.bts_station),
        job.mrt_station && h('span', { className: 'pf-chip' }, '🚇 MRT ' + job.mrt_station),
        Number.isFinite(distance?.stops) && h('span', { className: 'pf-chip pf-chip-strong' }, distance.stops === 0 ? 'Your station' : `${distance.stops} stop${distance.stops === 1 ? '' : 's'} from home`),
        Number.isFinite(distance?.km) && h('span', { className: 'pf-chip' }, distance.km.toFixed(1) + ' km away'),
        job.remote_ok && h('span', { className: 'pf-chip' }, '🏡 Remote OK'),
        h(ui.HealthPaw, { health: c.company_health, note: c.health_note }),
        h(ui.ReplyRate, { rate: c.response_rate, days: c.avg_reply_days }),
        c.intern_conversion_rate != null && h('span', { className: 'pf-chip' }, `${Math.round(c.intern_conversion_rate)}% interns → full-time`),
        c.sponsors_visa && h('span', { className: 'pf-chip' }, 'Visa support')),
      open && h('div', { className: 'pf-job-body' },
        job.description && h('p', { className: 'pf-pre' }, job.description),
        c.health_note && h('p', { className: 'lab-tiny' }, 'Company news: ' + c.health_note),
        h('p', { className: 'lab-tiny' }, 'Posted ' + fmtDate(job.published_at)),
        studio && h(studio.JobAiTools, { job, platform, onOpenAuth, onNavigate }),
        applied ? h(ui.Notice, { tone: 'good' }, 'You applied to this job.') : h(ApplyForm, { job, platform, onDone: onApplied, onOpenAuth })));
  }

  function JobsBoard({ platform, onOpenAuth, onNavigate }) {
    const [jobs, setJobs] = React.useState(null);
    const [error, setError] = React.useState('');
    const [applied, setApplied] = React.useState(new Set());
    const [q, setQ] = React.useState('');
    const [type, setType] = React.useState('');
    const [home, setHome] = React.useState('');
    const [maxStops, setMaxStops] = React.useState('');
    const [me, setMe] = React.useState(null);
    const [maxKm, setMaxKm] = React.useState('');
    const [minSalary, setMinSalary] = React.useState('');
    const [view, setView] = React.useState('list');
    const [selected, setSelected] = React.useState(null);
    const [geoMsg, setGeoMsg] = React.useState('');

    const load = React.useCallback(async () => {
      try {
        const sb = await getClient();
        const { data, error } = await sb.from('jobs')
          .select('id,title,description,employment_type,location,bts_station,mrt_station,lat,lng,remote_ok,salary_min,salary_max,published_at,company_id,companies(id,name,industry,company_health,health_note,response_rate,avg_reply_days,intern_conversion_rate,sponsors_visa,lat,lng)')
          .eq('status', 'published').order('published_at', { ascending: false }).limit(300);
        if (error) throw error;
        setJobs(data);
        if (platform.user && platform.profile?.role === 'student') {
          const { data: mine } = await sb.from('applications').select('job_id').eq('student_id', platform.user.id);
          setApplied(new Set((mine || []).map(a => a.job_id)));
        }
      } catch (e) { setError(friendlyError(e)); setJobs([]); }
    }, [platform.user?.id, platform.profile?.role]);
    React.useEffect(() => { load(); }, [load]);
    React.useEffect(() => {
      const p = platform.profile;
      if (p && !home) setHome(p.home_bts_station || p.home_mrt_station || '');
    }, [platform.profile?.id]);

    const locate = () => {
      if (!navigator.geolocation) { setGeoMsg('Location isn’t available in this browser.'); return; }
      setGeoMsg('Finding you…');
      navigator.geolocation.getCurrentPosition(pos => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoMsg(''); if (!maxKm) setMaxKm('5'); },
        () => setGeoMsg('Location permission was denied.'), { timeout: 10000 });
    };

    const rows = (jobs || []).map(j => {
      const loc = Number.isFinite(j.lat) ? j : j.companies;
      const stops = home ? Math.min(stopsBetween(home, j.bts_station), stopsBetween(home, j.mrt_station)) : Infinity;
      const km = me ? haversineKm(me, { lat: loc?.lat, lng: loc?.lng }) : Infinity;
      return { job: j, lat: loc?.lat, lng: loc?.lng, distance: { stops: Number.isFinite(stops) ? stops : undefined, km: Number.isFinite(km) ? km : undefined } };
    }).filter(({ job, distance }) => {
      const text = `${job.title} ${job.description || ''} ${job.companies?.name || ''} ${job.location || ''}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (type && job.employment_type !== type) return false;
      if (minSalary && job.salary_max < Number(minSalary)) return false;
      if (home && maxStops && !(distance.stops <= Number(maxStops))) return false;
      if (me && maxKm && !(distance.km <= Number(maxKm))) return false;
      return true;
    }).sort((a, b) => (home && maxStops ? (a.distance.stops ?? 99) - (b.distance.stops ?? 99) : 0) || (me && maxKm ? (a.distance.km ?? 99) - (b.distance.km ?? 99) : 0));

    const allStations = React.useMemo(() => stationNames(), []);
    const pointsKey = rows.map(r => r.job.id).join(',');
    const points = React.useMemo(() => rows.map(r => ({ id: r.job.id, lat: r.lat, lng: r.lng, title: r.job.title, subtitle: `${r.job.companies?.name || ''} · ฿${r.job.salary_min?.toLocaleString()}–${r.job.salary_max?.toLocaleString()}` })), [pointsKey]);
    const select = id => { setSelected(id); if (view === 'map') setView('split'); requestAnimationFrame(() => document.getElementById('job-' + id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); };

    return h('div', { className: 'pf-stack' },
      h('div', { className: 'pf-wall' }, h('strong', null, '🐟 Salary Transparency Wall'), h('span', null, 'Every job here shows a real monthly salary range. Listings without one can’t be published.')),
      h('div', { className: 'pf-card pf-filters' },
        h(ui.Field, { id: 'jf-q', label: 'Search' }, h(ui.Input, { id: 'jf-q', value: q, onChange: setQ, placeholder: 'Role, company, skill…', type: 'search' })),
        h(ui.Field, { id: 'jf-type', label: 'Type' }, h(ui.Select, { id: 'jf-type', value: type, onChange: setType, options: TYPES, placeholder: 'Any type' })),
        h(ui.Field, { id: 'jf-salary', label: 'Salary at least' }, h(ui.Select, { id: 'jf-salary', value: minSalary, onChange: setMinSalary, placeholder: 'Any salary', options: [['15000', '฿15,000'], ['25000', '฿25,000'], ['35000', '฿35,000'], ['50000', '฿50,000']] })),
        h(ui.Field, { id: 'jf-home', label: 'My BTS/MRT station' }, h(ui.Select, { id: 'jf-home', value: home, onChange: setHome, placeholder: 'Choose station', options: allStations })),
        h(ui.Field, { id: 'jf-stops', label: 'Within' }, h(ui.Select, { id: 'jf-stops', value: maxStops, onChange: setMaxStops, placeholder: 'Any distance', options: [['1', '1 stop'], ['3', '3 stops'], ['5', '5 stops'], ['10', '10 stops']] })),
        h(ui.Field, { id: 'jf-km', label: 'Near me' }, me
          ? h(ui.Select, { id: 'jf-km', value: maxKm, onChange: setMaxKm, placeholder: 'Any distance', options: [['2', '2 km'], ['5', '5 km'], ['10', '10 km'], ['20', '20 km']] })
          : h('button', { type: 'button', id: 'jf-km', className: 'lab-btn-ghost', onClick: locate }, '📍 Use my location')),
        geoMsg && h('p', { className: 'lab-tiny' }, geoMsg)),
      h('div', { className: 'lab-row lab-between' },
        h('p', { className: 'pf-muted', role: 'status' }, jobs === null ? 'Loading jobs…' : `${rows.length} job${rows.length === 1 ? '' : 's'}`),
        h('div', { className: 'pf-seg pf-seg-small', role: 'group', 'aria-label': 'View' }, ...[['list', 'List'], ['split', 'List + map'], ['map', 'Map']].map(([id, t]) => h('button', { key: id, type: 'button', className: view === id ? 'on' : '', 'aria-pressed': view === id, onClick: () => setView(id) }, t)))),
      error && h(ui.Notice, { tone: 'error' }, error),
      h('div', { className: 'pf-jobs-layout pf-view-' + view },
        view !== 'map' && h('div', { className: 'pf-job-list' },
          jobs && !rows.length ? h(ui.Empty, { icon: '🐾' }, jobs.length ? 'No jobs match these filters. Try more stops or a lower salary.' : 'No jobs are published yet. Companies can post one from the Companies tab.') : null,
          ...rows.map(r => h(JobCard, { key: r.job.id, job: r.job, platform, distance: r.distance, applied: applied.has(r.job.id), selected: selected === r.job.id, onSelect: setSelected, onApplied: load, onOpenAuth, onNavigate }))),
        view !== 'list' && h(maps.JobsMap, { points, onSelect: select, me, height: view === 'map' ? 520 : 460 })));
  }

  return { JobsBoard, typeLabel, TYPES };
}
