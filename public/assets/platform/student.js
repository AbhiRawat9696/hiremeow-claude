// Student hub (signed-in): profile, Open to offers, 1-Minute Meow Pitch, offers inbox, application timeline.
import { getClient, friendlyError, fmtDate, baht, refreshProfile } from './client.js';
import { stationNames } from './stations.js';

const MAX_SECONDS = 60;
const INDUSTRIES = ['Tech', 'Business', 'Manufacturing', 'Hospitality', 'Education', 'Healthcare', 'Finance', 'Startup'];
const QUESTIONS = ['Show us something you made and why you’re proud of it.', 'Why do you want to build your career in Thailand?', 'Tell us about a problem you solved in under a minute.'];

function videoDuration(blob) {
  return new Promise(resolve => {
    const v = document.createElement('video'); v.preload = 'metadata';
    const url = URL.createObjectURL(blob);
    const done = d => { URL.revokeObjectURL(url); resolve(d); };
    v.onloadedmetadata = () => {
      if (v.duration === Infinity) { v.currentTime = 1e7; v.ontimeupdate = () => { v.ontimeupdate = null; done(v.duration); }; }
      else done(v.duration);
    };
    v.onerror = () => done(NaN);
    v.src = url;
  });
}

export function createStudent(React, ui) {
  const h = React.createElement;
  const BTS = stationNames('BTS'), MRT = stationNames('MRT');

  function ProfileCard({ profile, onSaved }) {
    const pick = p => ({ full_name: p.full_name || '', headline: p.headline || '', nationality: p.nationality || '', university: p.university || '', field_of_study: p.field_of_study || '', grad_year: p.grad_year || '', languages: p.languages || '', visa_type: p.visa_type || '', visa_expiry: p.visa_expiry || '', career_goal: p.career_goal || '', home_bts_station: p.home_bts_station || '', home_mrt_station: p.home_mrt_station || '', desired_salary_min: p.desired_salary_min || '', skills: (p.skills || []).join(', '), preferred_industries: p.preferred_industries || [] });
    const [f, setF] = React.useState(() => pick(profile));
    const [editing, setEditing] = React.useState(!profile.full_name || !profile.university);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const set = k => v => setF(prev => ({ ...prev, [k]: v }));
    const save = async e => {
      e.preventDefault(); setBusy(true); setMsg(null);
      try {
        const sb = await getClient();
        const blank = v => (String(v).trim() === '' ? null : v);
        const { error } = await sb.from('profiles').update({
          full_name: blank(f.full_name.trim()), headline: blank(f.headline.trim()), nationality: blank(f.nationality), university: blank(f.university), field_of_study: blank(f.field_of_study),
          grad_year: f.grad_year ? Number(f.grad_year) : null, languages: blank(f.languages), visa_type: blank(f.visa_type), visa_expiry: blank(f.visa_expiry), career_goal: blank(f.career_goal),
          home_bts_station: blank(f.home_bts_station), home_mrt_station: blank(f.home_mrt_station), desired_salary_min: f.desired_salary_min ? Number(f.desired_salary_min) : null,
          skills: f.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20), preferred_industries: f.preferred_industries
        }).eq('id', profile.id);
        if (error) throw error;
        await onSaved(); setEditing(false); setMsg({ tone: 'good', text: 'Profile saved to your account.' });
      } catch (err) { setMsg({ tone: 'error', text: friendlyError(err) }); } finally { setBusy(false); }
    };
    if (!editing) return h('div', { className: 'pf-card pf-person' },
      h('div', null, h('h3', null, profile.full_name || 'Your profile'), h('p', { className: 'pf-muted' }, [profile.field_of_study, profile.university, profile.grad_year].filter(Boolean).join(' · ')),
        profile.headline && h('p', null, profile.headline),
        h('div', { className: 'pf-chips' },
          profile.home_bts_station && h('span', { className: 'pf-chip' }, '🚆 ' + profile.home_bts_station),
          profile.home_mrt_station && h('span', { className: 'pf-chip' }, '🚇 ' + profile.home_mrt_station),
          profile.meow_score != null && h('span', { className: 'pf-chip pf-chip-strong' }, 'MeowScore ' + profile.meow_score),
          profile.dna_type && h('span', { className: 'pf-chip' }, '🧬 ' + profile.dna_type),
          ...(profile.skills || []).slice(0, 6).map(s => h('span', { key: s, className: 'pf-chip' }, s)))),
      h('button', { type: 'button', className: 'pd-ghost', onClick: () => { setF(pick(profile)); setEditing(true); } }, 'Edit'),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text));
    return h('form', { className: 'pf-card pf-form', onSubmit: save },
      h('h3', null, 'Your account profile'),
      h('p', { className: 'pf-muted' }, 'Companies see this when you apply or switch on Open to offers.'),
      h('div', { className: 'pd-grid' },
        h(ui.Field, { id: 'sp-name', label: 'Full name' }, h(ui.Input, { id: 'sp-name', value: f.full_name, onChange: set('full_name'), required: true, maxLength: 120 })),
        h(ui.Field, { id: 'sp-headline', label: 'Headline' }, h(ui.Input, { id: 'sp-headline', value: f.headline, onChange: set('headline'), maxLength: 160, placeholder: 'e.g. Marketing grad who loves data' })),
        h(ui.Field, { id: 'sp-nat', label: 'Nationality' }, h(ui.Input, { id: 'sp-nat', value: f.nationality, onChange: set('nationality') })),
        h(ui.Field, { id: 'sp-uni', label: 'University' }, h(ui.Input, { id: 'sp-uni', value: f.university, onChange: set('university') })),
        h(ui.Field, { id: 'sp-field', label: 'Field of study' }, h(ui.Input, { id: 'sp-field', value: f.field_of_study, onChange: set('field_of_study') })),
        h(ui.Field, { id: 'sp-year', label: 'Graduation year' }, h(ui.Input, { id: 'sp-year', type: 'number', min: 1980, max: 2100, value: f.grad_year, onChange: set('grad_year') })),
        h(ui.Field, { id: 'sp-lang', label: 'Languages' }, h(ui.Input, { id: 'sp-lang', value: f.languages, onChange: set('languages') })),
        h(ui.Field, { id: 'sp-skills', label: 'Skills', hint: 'Comma separated' }, h(ui.Input, { id: 'sp-skills', value: f.skills, onChange: set('skills'), placeholder: 'Canva, Excel, Python' })),
        h(ui.Field, { id: 'sp-bts', label: 'Home BTS station' }, h(ui.Select, { id: 'sp-bts', value: f.home_bts_station, onChange: set('home_bts_station'), options: BTS, placeholder: 'None' })),
        h(ui.Field, { id: 'sp-mrt', label: 'Home MRT station' }, h(ui.Select, { id: 'sp-mrt', value: f.home_mrt_station, onChange: set('home_mrt_station'), options: MRT, placeholder: 'None' })),
        h(ui.Field, { id: 'sp-sal', label: 'Minimum salary wanted (THB)' }, h(ui.Input, { id: 'sp-sal', type: 'number', min: 0, value: f.desired_salary_min, onChange: set('desired_salary_min') })),
        h(ui.Field, { id: 'sp-visa', label: 'Current visa' }, h(ui.Input, { id: 'sp-visa', value: f.visa_type, onChange: set('visa_type'), placeholder: 'e.g. ED Plus' })),
        h(ui.Field, { id: 'sp-exp', label: 'Visa expiry' }, h(ui.Input, { id: 'sp-exp', type: 'date', value: f.visa_expiry, onChange: set('visa_expiry') })),
        h(ui.Field, { id: 'sp-goal', label: 'Career goal' }, h(ui.Input, { id: 'sp-goal', value: f.career_goal, onChange: set('career_goal'), maxLength: 300 }))),
      h('fieldset', { className: 'pd-industries' }, h('legend', null, 'Industries'),
        ...INDUSTRIES.map(i => h('label', { key: i, className: f.preferred_industries.includes(i) ? 'on' : '' }, h('input', { type: 'checkbox', id: 'sp-ind-' + i, checked: f.preferred_industries.includes(i), onChange: () => set('preferred_industries')(f.preferred_industries.includes(i) ? f.preferred_industries.filter(x => x !== i) : [...f.preferred_industries, i]) }), i))),
      msg && h(ui.Notice, { tone: msg.tone }, msg.text),
      h('div', { className: 'lab-row' }, h('button', { type: 'submit', className: 'lab-btn', disabled: busy }, busy ? 'Saving…' : 'Save profile'), profile.full_name && h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => setEditing(false) }, 'Cancel')));
  }

  function OpenToOffers({ profile, onSaved }) {
    const [busy, setBusy] = React.useState(false);
    const toggle = async on => {
      setBusy(true);
      const sb = await getClient();
      await sb.from('profiles').update({ open_to_offers: on }).eq('id', profile.id);
      await onSaved(); setBusy(false);
    };
    return h('div', { className: 'pf-card pf-open' },
      h('label', { className: 'demo-toggle', htmlFor: 'open-offers' },
        h('input', { type: 'checkbox', role: 'switch', id: 'open-offers', checked: profile.open_to_offers, disabled: busy, onChange: e => toggle(e.target.checked) }),
        h('span', { className: 'demo-switch', 'aria-hidden': true }),
        h('span', null, h('strong', null, profile.open_to_offers ? 'Open to offers' : 'Not open to offers'),
          h('small', null, profile.open_to_offers ? 'Companies can find your profile and pitch video, and send offers with the salary up front.' : 'Switch on to let companies come to you. No applying needed.'))));
  }

  function PitchRecorder({ profile, onSaved }) {
    const [sb, setSb] = React.useState(null);
    const [current, setCurrent] = React.useState(null);
    const [state, setState] = React.useState('idle');
    const [left, setLeft] = React.useState(MAX_SECONDS);
    const [preview, setPreview] = React.useState(null);
    const [msg, setMsg] = React.useState(null);
    const [question, setQuestion] = React.useState(QUESTIONS[0]);
    const live = React.useRef(null), rec = React.useRef(null), stream = React.useRef(null), started = React.useRef(0);
    React.useEffect(() => { getClient().then(setSb); }, []);
    React.useEffect(() => {
      if (!sb || !profile.pitch_video_id) { setCurrent(null); return; }
      sb.from('video_pitches').select('*').eq('id', profile.pitch_video_id).maybeSingle().then(({ data }) => setCurrent(data));
    }, [sb, profile.pitch_video_id]);
    React.useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); }, []);
    React.useEffect(() => {
      if (state !== 'recording') return;
      if (left <= 0) { stop(); return; }
      const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t);
    }, [state, left]);

    const start = async () => {
      setMsg(null);
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }, audio: true });
        stream.current = s; if (live.current) live.current.srcObject = s;
        const type = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'].find(t => window.MediaRecorder?.isTypeSupported?.(t)) || '';
        const chunks = []; const r = new MediaRecorder(s, type ? { mimeType: type, videoBitsPerSecond: 1_500_000 } : undefined); rec.current = r;
        r.ondataavailable = e => e.data.size && chunks.push(e.data);
        r.onstop = () => {
          s.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: (r.mimeType || 'video/webm').split(';')[0] });
          const seconds = Math.min(MAX_SECONDS, Math.max(1, Math.round((Date.now() - started.current) / 1000)));
          setPreview({ blob, url: URL.createObjectURL(blob), seconds }); setState('review');
        };
        started.current = Date.now(); r.start(1000); setLeft(MAX_SECONDS); setState('recording');
      } catch { setMsg({ tone: 'error', text: 'Camera or microphone is blocked. Allow access, or upload a video file instead.' }); }
    };
    const stop = () => { if (rec.current?.state === 'recording') rec.current.stop(); };
    const onFile = async e => {
      const file = e.target.files?.[0]; e.target.value = '';
      if (!file) return;
      if (!/^video\/(webm|mp4|quicktime)$/.test(file.type)) { setMsg({ tone: 'error', text: 'Use a WebM, MP4 or MOV video.' }); return; }
      if (file.size > 50 * 1024 * 1024) { setMsg({ tone: 'error', text: 'That file is over 50 MB. Record a shorter or lower-resolution clip.' }); return; }
      const d = await videoDuration(file);
      if (!(d > 0) || d > MAX_SECONDS + 1) { setMsg({ tone: 'error', text: `Pitches must be ${MAX_SECONDS} seconds or less (this one is ${Number.isFinite(d) ? Math.round(d) + 's' : 'unknown length'}).` }); return; }
      setPreview({ blob: file, url: URL.createObjectURL(file), seconds: Math.max(1, Math.round(d)) }); setState('review');
    };
    const upload = async () => {
      setState('uploading'); setMsg(null);
      try {
        const ext = preview.blob.type.includes('mp4') ? 'mp4' : preview.blob.type.includes('quicktime') ? 'mov' : 'webm';
        const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
        const up = await sb.storage.from('pitch-videos').upload(path, preview.blob, { contentType: preview.blob.type || 'video/webm', upsert: false });
        if (up.error) throw up.error;
        const { data, error } = await sb.from('video_pitches').insert({ student_id: profile.id, storage_path: path, duration_seconds: preview.seconds, question, mime_type: preview.blob.type }).select().single();
        if (error) throw error;
        const old = current;
        const { error: e2 } = await sb.from('profiles').update({ pitch_video_id: data.id }).eq('id', profile.id);
        if (e2) throw e2;
        if (old) { await sb.from('video_pitches').delete().eq('id', old.id); await sb.storage.from('pitch-videos').remove([old.storage_path]); }
        URL.revokeObjectURL(preview.url); setPreview(null); setState('idle');
        setMsg({ tone: 'good', text: 'Pitch saved! It now shows on your profile.' }); await onSaved();
      } catch (err) { setState('review'); setMsg({ tone: 'error', text: friendlyError(err) }); }
    };
    const remove = async () => {
      if (!current) return;
      await sb.from('profiles').update({ pitch_video_id: null }).eq('id', profile.id);
      await sb.from('video_pitches').delete().eq('id', current.id);
      await sb.storage.from('pitch-videos').remove([current.storage_path]);
      setMsg({ tone: 'good', text: 'Pitch deleted.' }); await onSaved();
    };
    return h('section', { className: 'pf-card', 'aria-labelledby': 'pitch-title' },
      h('h3', { id: 'pitch-title' }, '🎬 1-Minute Meow Pitch'),
      h('p', { className: 'pf-muted' }, 'No cover letter. Record a vertical video of up to 60 seconds answering one question. It’s attached to your applications and shown to companies when you’re open to offers.'),
      h('div', { className: 'demo-pitch' },
        h('div', { className: 'demo-phone' },
          state === 'recording' ? h('video', { ref: live, autoPlay: true, muted: true, playsInline: true })
          : preview ? h('video', { src: preview.url, controls: true, playsInline: true })
          : current ? h(ui.VideoPlayer, { path: current.storage_path, sb })
          : h('div', { className: 'demo-phone-q' }, h('span', null, 'Your question'), h('strong', null, '“' + question + '”')),
          state === 'recording' && h('span', { className: 'demo-rec', role: 'timer' }, '● ' + left + 's')),
        h('div', null,
          state === 'idle' && h(ui.Field, { id: 'pitch-q', label: 'Question' }, h(ui.Select, { id: 'pitch-q', value: question, onChange: setQuestion, options: QUESTIONS })),
          current && state === 'idle' && h('p', { className: 'lab-tiny' }, `Current pitch: ${current.duration_seconds}s · recorded ${fmtDate(current.created_at)}`),
          msg && h(ui.Notice, { tone: msg.tone }, msg.text),
          h('div', { className: 'lab-row' },
            state === 'idle' && h('button', { type: 'button', className: 'lab-btn', onClick: start, disabled: !sb }, current ? 'Record a new pitch' : 'Start recording'),
            state === 'idle' && h('label', { className: 'lab-btn-ghost pf-file', htmlFor: 'pitch-file' }, 'Upload a video', h('input', { id: 'pitch-file', type: 'file', accept: 'video/webm,video/mp4,video/quicktime', onChange: onFile })),
            state === 'idle' && current && h('button', { type: 'button', className: 'lab-btn-ghost', onClick: remove }, 'Delete pitch'),
            state === 'recording' && h('button', { type: 'button', className: 'lab-btn', onClick: stop }, 'Stop'),
            state === 'review' && h('button', { type: 'button', className: 'lab-btn', onClick: upload }, `Save this ${preview.seconds}s pitch`),
            state === 'review' && h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => { URL.revokeObjectURL(preview.url); setPreview(null); setState('idle'); } }, 'Discard'),
            state === 'uploading' && h('span', { className: 'pf-muted' }, 'Uploading…')))));
  }

  function OffersInbox({ profile }) {
    const [offers, setOffers] = React.useState(null);
    const load = React.useCallback(async () => {
      const sb = await getClient();
      const { data } = await sb.from('offers').select('*,companies(name,industry,company_health,health_note,response_rate,website)').eq('student_id', profile.id).order('created_at', { ascending: false });
      setOffers(data || []);
    }, [profile.id]);
    React.useEffect(() => { load(); }, [load]);
    const answer = async (o, status) => { const sb = await getClient(); await sb.from('offers').update({ status }).eq('id', o.id); load(); };
    return h('section', { className: 'pf-card', 'aria-labelledby': 'inbox-title' },
      h('h3', { id: 'inbox-title' }, '💌 Offers for you'),
      offers === null ? h('p', null, 'Loading…') : !offers.length ? h(ui.Empty, { icon: '📭' }, profile.open_to_offers ? 'No offers yet. Companies can now find you.' : 'Switch on Open to offers to receive “We want to hire you” messages.') :
      h('ul', { className: 'demo-offers pf-offers' }, ...offers.map(o => h('li', { key: o.id, className: 'demo-offer' },
        h('p', { className: 'demo-offer-kicker' }, (o.companies?.name || 'A company') + ' wants to hire you'),
        h('strong', null, o.title), h('p', { className: 'demo-salary' }, `${baht(o.salary_min)} – ${baht(o.salary_max)} / month`),
        h('div', { className: 'pf-chips' }, h(ui.HealthPaw, { health: o.companies?.company_health, note: o.companies?.health_note }), h(ui.ReplyRate, { rate: o.companies?.response_rate })),
        o.message && h('p', { className: 'demo-muted' }, '“' + o.message + '”'),
        o.status === 'pending'
          ? h('div', { className: 'demo-row' }, h('button', { type: 'button', className: 'lab-btn', onClick: () => answer(o, 'accepted') }, 'I’m interested'), h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => answer(o, 'declined') }, 'No thanks'))
          : h('span', { className: 'pf-status pf-status-' + o.status }, o.status === 'accepted' ? 'You said yes · the company will contact you' : ui.label(o.status))))));
  }

  function MyApplications({ profile, onNavigate }) {
    const [apps, setApps] = React.useState(null);
    const load = React.useCallback(async () => {
      const sb = await getClient();
      const { data } = await sb.from('applications').select('id,status,created_at,updated_at,nudge_count,jobs(title,salary_min,salary_max,companies(name,response_rate,avg_reply_days)),application_events(status,created_at)').eq('student_id', profile.id).order('created_at', { ascending: false });
      setApps(data || []);
    }, [profile.id]);
    React.useEffect(() => { load(); }, [load]);
    const withdraw = async a => { const sb = await getClient(); await sb.from('applications').update({ status: 'withdrawn' }).eq('id', a.id); load(); };
    return h('section', { className: 'pf-card', 'aria-labelledby': 'myapps-title' },
      h('div', { className: 'lab-row lab-between' }, h('h3', { id: 'myapps-title' }, '📦 Offer Timeline'), h('button', { type: 'button', className: 'pd-link', onClick: () => onNavigate('jobs') }, 'Find jobs →')),
      h('p', { className: 'pf-muted' }, 'Live tracking of every application: Applied → Viewed → Shortlisted → Interview → Offer.'),
      apps === null ? h('p', null, 'Loading…') : !apps.length ? h(ui.Empty, { icon: '🛵' }, 'No applications yet. Apply from the Jobs tab and track them here.') :
      h('ul', { className: 'pd-list' }, ...apps.map(a => h('li', { key: a.id },
        h('div', { className: 'pd-li-top' },
          h('div', null, h('strong', null, a.jobs?.title || 'Job'), h('span', null, `${a.jobs?.companies?.name || ''} · ${baht(a.jobs?.salary_min)}–${baht(a.jobs?.salary_max)} · applied ${fmtDate(a.created_at)}`)),
          ['applied', 'viewed', 'shortlisted', 'interview'].includes(a.status) && h('button', { type: 'button', className: 'pd-ghost pd-small', onClick: () => withdraw(a) }, 'Withdraw')),
        h(ui.Timeline, { status: a.status, events: a.application_events || [] }),
        a.nudge_count > 0 && ['applied', 'viewed', 'shortlisted', 'interview'].includes(a.status) && h('p', { className: 'lab-tiny' }, `🐾 Ghosting Protection: Meow reminded this company ${a.nudge_count} time${a.nudge_count === 1 ? '' : 's'}.`)))));
  }

  function StudentHub({ platform, onNavigate }) {
    const profile = platform.profile;
    if (!profile) return h('p', null, 'Loading your account…');
    const reload = () => refreshProfile();
    return h('div', { className: 'pf-stack' },
      h(ProfileCard, { key: profile.id, profile, onSaved: reload }),
      profile.is_meow_pool_top50 && h(ui.Notice, { tone: 'good' }, '⭐ You’re in this month’s Meow Pool Top 50! Partner companies can see your profile and pitch.'),
      h(OpenToOffers, { profile, onSaved: reload }),
      h('div', { className: 'pf-two' }, h(OffersInbox, { profile }), h(PitchRecorder, { profile, onSaved: reload })),
      h(MyApplications, { profile, onNavigate }));
  }

  return { StudentHub };
}
