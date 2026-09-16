// Meow AI Studio (students), job-card AI tools, public candidate chat, portfolio pages, recruiter Copilot.
import { api, getClient, friendlyError, baht, fmtDate } from './client.js';
import { matchJob, matchSentence } from './skills-dict.js';

const MAX_PDF = 3 * 1024 * 1024;
export const skill = (name, input) => api('/api/skill', { method: 'POST', body: { skill: name, input } }).then(r => r.result);
export const readFile = file => new Promise((resolve, reject) => {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isText = /^text\//.test(file.type) || /\.(txt|md)$/i.test(file.name);
  if (!isPdf && !isText) return reject(new Error('Use a PDF or .txt file. For Word files, save as PDF first.'));
  if (file.size > MAX_PDF) return reject(new Error('That file is over 3 MB.'));
  const r = new FileReader();
  r.onerror = () => reject(new Error('Could not read that file.'));
  r.onload = () => resolve(isPdf ? { kind: 'pdf', name: file.name, data: r.result } : { kind: 'text', name: file.name, text: String(r.result) });
  isPdf ? r.readAsDataURL(file) : r.readAsText(file);
});
const resumeInput = r => (r.file?.kind === 'pdf' ? { resume_file: { name: r.file.name, data: r.file.data } } : { resume_text: r.file?.kind === 'text' ? r.file.text : r.text });
const copy = async (t, set) => { try { await navigator.clipboard.writeText(t); set?.('Copied!'); setTimeout(() => set?.(''), 1500); } catch { set?.('Copy failed. Select the text instead.'); } };
const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
const linkedInShare = t => 'https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(t + ' ' + location.origin);
const SR = () => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

export function createStudio(React, ui) {
  const h = React.createElement;

  // ---------- shared bits ----------
  function useRun() {
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const run = async fn => { setBusy(true); setError(''); try { return await fn(); } catch (e) { setError(friendlyError(e)); return null; } finally { setBusy(false); } };
    return { busy, error, run, setError };
  }
  const Err = ({ text }) => text ? h(ui.Notice, { tone: 'error' }, text) : null;
  const Btn = ({ busy, children, ...rest }) => h('button', { type: 'button', className: 'lab-btn', ...rest, disabled: busy || rest.disabled }, busy ? 'Meow is thinking…' : children);
  const List = ({ items, empty }) => items?.length ? h('ul', { className: 'st-list' }, ...items.map((t, i) => h('li', { key: i }, t))) : empty ? h('p', { className: 'pf-muted' }, empty) : null;
  const CopyBtn = ({ text, label = 'Copy' }) => { const [m, setM] = React.useState(''); return h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => copy(text, setM) }, m || label); };
  const Out = ({ title, text, file }) => h('div', { className: 'st-out' },
    h('div', { className: 'lab-row lab-between' }, h('strong', null, title), h('div', { className: 'lab-row' }, h(CopyBtn, { text }), file && h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => download(file, text) }, 'Download .txt'))),
    h('pre', { className: 'st-pre' }, text));

  function useJobs() {
    const [jobs, setJobs] = React.useState(null);
    React.useEffect(() => { let live = true; (async () => {
      const sb = await getClient(); if (!sb) { live && setJobs([]); return; }
      const { data } = await sb.from('jobs').select('id,title,description,salary_min,salary_max,companies(name)').eq('status', 'published').order('published_at', { ascending: false }).limit(200);
      live && setJobs(data || []);
    })(); return () => { live = false; }; }, []);
    return jobs;
  }
  function JobPicker({ id, value, onChange, jobs, optional }) {
    return h(ui.Field, { id, label: optional ? 'HireMeow job (optional)' : 'HireMeow job' },
      jobs === null ? h('p', { className: 'pf-muted' }, 'Loading jobs…') : !jobs.length ? h('p', { className: 'pf-muted' }, 'No published jobs yet.') :
      h(ui.Select, { id, value, onChange, options: jobs.map(j => [j.id, `${j.title} · ${j.companies?.name || ''}`]), placeholder: optional ? 'No specific job' : 'Choose a job…' }));
  }
  function ResumeBox({ id, value, onChange }) {
    const [err, setErr] = React.useState('');
    const onFile = async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setErr(''); try { onChange({ ...value, file: await readFile(f) }); } catch (x) { setErr(x.message); } };
    return h('div', { className: 'st-resume' },
      value.file
        ? h('p', { className: 'st-file' }, '📄 ', h('b', null, value.file.name), ' ', h('button', { type: 'button', className: 'ma-linkbtn', onClick: () => onChange({ ...value, file: null }) }, 'Remove'))
        : h(ui.Field, { id, label: 'Your resume', hint: 'Paste the text, or upload a PDF (max 3 MB). Remove ID/passport numbers and your home address first.' },
            h(ui.TextArea, { id, value: value.text, onChange: t => onChange({ ...value, text: t }), rows: 7, maxLength: 40000, placeholder: 'Paste your resume here…' })),
      !value.file && h('label', { className: 'lab-btn-ghost pd-small st-upload' }, '⬆ Upload PDF or .txt', h('input', { type: 'file', accept: '.pdf,.txt,application/pdf,text/plain', onChange: onFile, hidden: true })),
      err && h('p', { className: 'ma-err' }, err));
  }
  const hasResume = r => Boolean(r.file || r.text.trim().length > 50);
  const Lives = ({ n }) => h('span', { className: 'st-lives', role: 'img', 'aria-label': `${n} of 9 lives` }, ...Array.from({ length: 9 }, (_, i) => h('span', { key: i, className: i < n ? 'on' : '' }, '🐱')));
  const RiskBox = ({ res }) => h('div', { className: 'st-out st-risk st-risk-' + res.risk },
    h('p', { className: 'st-big' }, { low: '✅ Low risk', medium: '⚠️ Medium risk', high: '🚨 High risk' }[res.risk]),
    h(List, { items: [...new Set([...(res.rule_flags || []), ...(res.flags || [])])], empty: 'No warning signs found.' }), h('p', null, res.advice));

  // ---------- student tabs ----------
  function MatchTailor({ jobs, platform, jobId, setJobId }) {
    const [resume, setResume] = React.useState({ text: '', file: null });
    const [jobText, setJobText] = React.useState('');
    const [ex, setEx] = React.useState(null);
    const [tl, setTl] = React.useState(null);
    const a = useRun(), b = useRun();
    const job = jobs?.find(j => j.id === jobId);
    const quick = job && platform.profile ? matchJob(job, platform.profile) : null;
    return h('div', { className: 'st-grid' },
      h('section', { className: 'pf-card' },
        h('h3', null, '🎯 Smart Job Match'),
        h(JobPicker, { id: 'st-mt-job', value: jobId, onChange: v => { setJobId(v); setEx(null); }, jobs }),
        quick && h('p', { className: 'st-big' }, matchSentence(quick)),
        quick && !platform.profile?.skills?.length && h('p', { className: 'lab-tiny' }, 'Add skills to My profile for a sharper match.'),
        h(Btn, { busy: a.busy, disabled: !jobId, onClick: () => a.run(async () => setEx(await skill('match_explain', { job_id: jobId }))) }, 'Explain my match'),
        h(Err, { text: a.error }),
        ex && h('div', { className: 'st-out' }, h('p', null, h('b', null, `${ex.match.percent}% · `), ex.summary),
          h('p', { className: 'st-label' }, 'Strengths'), h(List, { items: ex.strengths }),
          h('p', { className: 'st-label' }, 'Gaps and how to close them'), h(List, { items: ex.gaps.map(g => `${g.skill}: ${g.how_to_close}`), empty: 'No major gaps.' }),
          h('p', null, h('b', null, 'Next step: '), ex.next_step))),
      h('section', { className: 'pf-card' },
        h('h3', null, '🪄 1-Click Resume Tailor'),
        h('p', { className: 'lab-tiny' }, 'Rewrites your resume for this job so applicant tracking systems (ATS) pick it up. Facts stay true: skills you don’t have are listed as gaps, never added.'),
        !jobId && h(ui.Field, { id: 'st-mt-jt', label: 'Or paste a job description (e.g. copied from a job link)' }, h(ui.TextArea, { id: 'st-mt-jt', value: jobText, onChange: setJobText, rows: 4, maxLength: 12000 })),
        h(ResumeBox, { id: 'st-mt-cv', value: resume, onChange: setResume }),
        h(Btn, { busy: b.busy, disabled: !hasResume(resume) || (!jobId && jobText.trim().length < 40), onClick: () => b.run(async () => setTl(await skill('tailor_resume', { ...(jobId ? { job_id: jobId } : { job_text: jobText }), ...resumeInput(resume) }))) }, 'Tailor my resume'),
        h(Err, { text: b.error }),
        tl && h(React.Fragment, null,
          h('p', { className: 'st-big' }, `ATS fit: ${tl.ats_score_before}% → ${tl.ats_score_after}%`),
          h(Out, { title: 'Tailored resume', text: tl.tailored_resume, file: 'resume-tailored.txt' }),
          h('p', { className: 'st-label' }, 'Keywords added'), h(List, { items: tl.keywords_added }),
          h('p', { className: 'st-label' }, 'Skills the job wants that you didn’t show'), h(List, { items: tl.missing_skills, empty: 'None.' }),
          h('p', { className: 'st-label' }, 'What changed'), h(List, { items: tl.changes }))));
  }

  function Letters({ jobs, jobId, setJobId }) {
    const [language, setLanguage] = React.useState('en');
    const [notes, setNotes] = React.useState('');
    const [name, setName] = React.useState('');
    const [cl, setCl] = React.useState(null);
    const [intro, setIntro] = React.useState(null);
    const a = useRun(), b = useRun();
    return h('div', { className: 'st-stack' },
      h(JobPicker, { id: 'st-cl-job', value: jobId, onChange: setJobId, jobs }),
      h('div', { className: 'st-grid' },
        h('section', { className: 'pf-card' },
          h('h3', null, '✉️ Cover Letter Generator'),
          h('p', { className: 'lab-tiny' }, 'Pulls the key requirements straight from the job description and matches them to your profile.'),
          h(ui.Field, { id: 'st-cl-lang', label: 'Language' }, h(ui.Select, { id: 'st-cl-lang', value: language, onChange: setLanguage, options: [['en', 'English'], ['th', 'Thai']] })),
          h(ui.Field, { id: 'st-cl-notes', label: 'Anything to highlight? (optional)' }, h(ui.TextArea, { id: 'st-cl-notes', value: notes, onChange: setNotes, rows: 3, maxLength: 2000, placeholder: 'e.g. I built a sales dashboard for my family’s Shopee shop' })),
          h(Btn, { busy: a.busy, disabled: !jobId, onClick: () => a.run(async () => setCl(await skill('cover_letter', { job_id: jobId, language, notes }))) }, 'Write my cover letter'),
          h(Err, { text: a.error }),
          cl && h(React.Fragment, null, h(Out, { title: cl.subject, text: cl.letter, file: 'cover-letter.txt' }), h('p', { className: 'lab-tiny' }, 'Taken from the job ad: ' + cl.requirements_used.join('; ')))),
        h('section', { className: 'pf-card' },
          h('h3', null, '😺 Purr-fect Intro'),
          h('p', { className: 'lab-tiny' }, 'A 2-line LinkedIn DM to the hiring manager, in English and Thai.'),
          h(ui.Field, { id: 'st-in-name', label: 'Hiring manager’s name (optional)' }, h(ui.Input, { id: 'st-in-name', value: name, onChange: setName, maxLength: 80 })),
          h(Btn, { busy: b.busy, disabled: !jobId, onClick: () => b.run(async () => setIntro(await skill('purrfect_intro', { job_id: jobId, recipient_name: name }))) }, 'Write my intro'),
          h(Err, { text: b.error }),
          intro && h(React.Fragment, null, h(Out, { title: 'English', text: intro.english }), h(Out, { title: 'ภาษาไทย', text: intro.thai })))));
  }

  function Interview({ jobs, jobId, setJobId }) {
    const [role, setRole] = React.useState('');
    const [language, setLanguage] = React.useState('en');
    const [voice, setVoice] = React.useState(Boolean(SR()));
    const [history, setHistory] = React.useState([]);
    const [q, setQ] = React.useState(null);
    const [answer, setAnswer] = React.useState('');
    const [listening, setListening] = React.useState(false);
    const recRef = React.useRef(null);
    const { busy, error, run } = useRun();
    const speak = t => { if (!voice || !window.speechSynthesis || !t) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = language === 'th' ? 'th-TH' : 'en-US'; window.speechSynthesis.speak(u); };
    const step = hist => run(async () => { const r = await skill('interview', { job_id: jobId || undefined, role, language, history: hist }); setQ(r); speak(r.done ? r.overall.summary : r.next_question); });
    const start = () => { setHistory([]); setAnswer(''); setQ(null); step([]); };
    const submit = () => { if (!answer.trim() || !q?.next_question) return; const hist = [...history, { question: q.next_question, answer: answer.trim() }]; setHistory(hist); setAnswer(''); step(hist); };
    const listen = () => {
      const R = SR(); if (!R) return;
      if (listening) { recRef.current?.stop(); return; }
      const rec = new R(); recRef.current = rec; rec.lang = language === 'th' ? 'th-TH' : 'en-US'; rec.interimResults = true; rec.continuous = true;
      const base = answer ? answer + ' ' : '';
      rec.onresult = e => setAnswer(base + [...e.results].map(r => r[0].transcript).join(' '));
      rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
      window.speechSynthesis?.cancel(); rec.start(); setListening(true);
    };
    React.useEffect(() => () => { recRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);
    return h('section', { className: 'pf-card' },
      h('h3', null, '🎙️ Interview Simulator'),
      h('p', { className: 'lab-tiny' }, 'Five realistic questions for the role, with feedback after each answer. Voice works in Chrome, Edge and Safari; you can always type.'),
      h('div', { className: 'st-grid' },
        h(JobPicker, { id: 'st-iv-job', value: jobId, onChange: setJobId, jobs, optional: true }),
        !jobId && h(ui.Field, { id: 'st-iv-role', label: 'Or type a role' }, h(ui.Input, { id: 'st-iv-role', value: role, onChange: setRole, placeholder: 'e.g. Junior Data Analyst', maxLength: 200 }))),
      h('div', { className: 'lab-row' },
        h(ui.Select, { id: 'st-iv-lang', value: language, onChange: setLanguage, options: [['en', 'English'], ['th', 'Thai']] }),
        SR() && h('label', { className: 'demo-check' }, h('input', { type: 'checkbox', checked: voice, onChange: e => setVoice(e.target.checked) }), ' Read questions aloud'),
        h(Btn, { busy: busy && !q, onClick: start, disabled: !jobId && !role.trim() }, q ? 'Restart' : 'Start interview')),
      h(Err, { text: error }),
      q && history.length > 0 && q.feedback?.score > 0 && h('div', { className: 'st-out' }, h('p', null, h('b', null, `Last answer: ${q.feedback.score}/5 · `), q.feedback.good), h('p', null, h('b', null, 'Improve: '), q.feedback.improve)),
      q && !q.done && h('div', { className: 'st-out' },
        h('p', { className: 'st-label' }, `Question ${history.length + 1} of 5`),
        h('p', { className: 'st-big' }, q.next_question),
        h(ui.TextArea, { id: 'st-iv-ans', value: answer, onChange: setAnswer, rows: 4, maxLength: 4000, placeholder: 'Your answer…' }),
        h('div', { className: 'lab-row' },
          SR() && h('button', { type: 'button', className: 'lab-btn-ghost', onClick: listen, 'aria-pressed': listening }, listening ? '⏹ Stop recording' : '🎤 Answer by voice'),
          h(Btn, { busy, onClick: () => { recRef.current?.stop(); submit(); }, disabled: !answer.trim() }, 'Send answer'))),
      q?.done && h('div', { className: 'st-out' }, h('p', { className: 'st-big' }, `Overall: ${q.overall.score}/5`), h('p', null, q.overall.summary), h(List, { items: q.overall.tips })));
  }

  function ScoreRoast({ jobs }) {
    const [resume, setResume] = React.useState({ text: '', file: null });
    const [jobId, setJobId] = React.useState('');
    const [score, setScore] = React.useState(null);
    const [roast, setRoast] = React.useState(null);
    const a = useRun(), b = useRun();
    const share = t => h('div', { className: 'lab-row' }, h(CopyBtn, { text: t, label: 'Copy share text' }), h('a', { className: 'lab-btn-ghost pd-small', href: linkedInShare(t), target: '_blank', rel: 'noopener noreferrer' }, 'Share on LinkedIn'));
    return h('div', { className: 'st-stack' },
      h('section', { className: 'pf-card' },
        h(ResumeBox, { id: 'st-sr-cv', value: resume, onChange: setResume }),
        h(JobPicker, { id: 'st-sr-job', value: jobId, onChange: setJobId, jobs, optional: true }),
        h('div', { className: 'lab-row' },
          h(Btn, { busy: a.busy, disabled: !hasResume(resume), onClick: () => a.run(async () => setScore(await skill('meow_score', { job_id: jobId || undefined, ...resumeInput(resume) }))) }, '🐱 Get my Meow Score'),
          h('button', { type: 'button', className: 'lab-btn-ghost', disabled: b.busy || !hasResume(resume), onClick: () => b.run(async () => setRoast(await skill('roast', resumeInput(resume)))) }, b.busy ? 'Sharpening claws…' : '🔥 Roast my resume')),
        h(Err, { text: a.error || b.error })),
      h('div', { className: 'st-grid' },
        score && h('section', { className: 'pf-card' }, h('h3', null, `Meow Score: ${score.lives}/9 lives`), h(Lives, { n: score.lives }), h('p', { className: 'st-big' }, score.headline),
          h('p', { className: 'st-label' }, 'Strengths'), h(List, { items: score.strengths }), h('p', { className: 'st-label' }, 'Fixes'), h(List, { items: score.fixes }), h('p', { className: 'st-quote' }, score.share_text), share(score.share_text)),
        roast && h('section', { className: 'pf-card st-roast' }, h('h3', null, '🔥 The Roast'), h('p', { className: 'st-big' }, roast.roast),
          h('p', { className: 'st-label' }, 'Why recruiters skip it'), h(List, { items: roast.why_ignored }), h('p', { className: 'st-label' }, 'Fix it'), h(List, { items: roast.fixes }), h('p', { className: 'st-quote' }, roast.share_text), share(roast.share_text))));
  }

  const srcLabel = s => (s === 'hiremeow_data' ? 'Based on HireMeow job listings' : 'AI estimate: HireMeow doesn’t have enough listings for this role yet');
  function Money() {
    const [role, setRole] = React.useState('');
    const [loc, setLoc] = React.useState('Bangkok');
    const [years, setYears] = React.useState('');
    const [offer, setOffer] = React.useState('');
    const [strengths, setStrengths] = React.useState('');
    const [ins, setIns] = React.useState(null);
    const [neg, setNeg] = React.useState(null);
    const a = useRun(), b = useRun();
    return h('div', { className: 'st-stack' },
      h('section', { className: 'pf-card' },
        h('h3', null, '💰 Salary Insight'),
        h('div', { className: 'st-grid' },
          h(ui.Field, { id: 'st-m-role', label: 'Role' }, h(ui.Input, { id: 'st-m-role', value: role, onChange: setRole, placeholder: 'e.g. Junior Marketing Executive', maxLength: 200 })),
          h(ui.Field, { id: 'st-m-loc', label: 'Location' }, h(ui.Input, { id: 'st-m-loc', value: loc, onChange: setLoc, maxLength: 100 })),
          h(ui.Field, { id: 'st-m-yrs', label: 'Years of experience' }, h(ui.Input, { id: 'st-m-yrs', type: 'number', min: 0, max: 40, value: years, onChange: setYears }))),
        h(Btn, { busy: a.busy, disabled: !role.trim(), onClick: () => a.run(async () => setIns(await skill('salary_insight', { role, location: loc, years: Number(years) || 0 }))) }, 'What do people like me earn?'),
        h(Err, { text: a.error }),
        ins && h('div', { className: 'st-out' }, h('p', { className: 'st-big' }, `${baht(ins.low)} – ${baht(ins.high)} / month`), h('p', null, ins.summary), h('p', { className: 'lab-tiny' }, `${srcLabel(ins.source)}${ins.data?.count ? ` (${ins.data.count} listings)` : ''}. ${ins.caveat}`), h(List, { items: ins.pay_drivers }))),
      h('section', { className: 'pf-card' },
        h('h3', null, '🤝 Offer Negotiation'),
        h('div', { className: 'st-grid' },
          h(ui.Field, { id: 'st-m-offer', label: 'Their offer (THB / month)' }, h(ui.Input, { id: 'st-m-offer', type: 'number', min: 1000, value: offer, onChange: setOffer, placeholder: '40000' })),
          h(ui.Field, { id: 'st-m-str', label: 'Your strengths (optional)' }, h(ui.Input, { id: 'st-m-str', value: strengths, onChange: setStrengths, maxLength: 1000 }))),
        h('p', { className: 'lab-tiny' }, 'Uses the role above.'),
        h(Btn, { busy: b.busy, disabled: !role.trim() || !(Number(offer) >= 1000), onClick: () => b.run(async () => setNeg(await skill('negotiate', { role, offer_thb: Number(offer), years: Number(years) || 0, strengths }))) }, 'Plan my negotiation'),
        h(Err, { text: b.error }),
        neg && h(React.Fragment, null,
          h('p', { className: 'st-big' }, `They offered ${baht(Number(offer))}. You can ask for about ${baht(neg.suggested_ask)}.`),
          h('p', { className: 'lab-tiny' }, `Market: ${baht(neg.market_low)} – ${baht(neg.market_high)} · ${srcLabel(neg.source)}`),
          h('p', null, neg.reasoning),
          h(Out, { title: 'Script (English)', text: neg.script_en }), h(Out, { title: 'สคริปต์ (ภาษาไทย)', text: neg.script_th }),
          h('p', { className: 'st-label' }, 'Also ask for'), h(List, { items: neg.other_asks }),
          h('p', { className: 'lab-tiny' }, neg.caveat + ' This is guidance, not financial or legal advice.'))));
  }

  function Career() {
    const [current, setCurrent] = React.useState('');
    const [target, setTarget] = React.useState('');
    const [salary, setSalary] = React.useState('');
    const [res, setRes] = React.useState(null);
    const { busy, error, run } = useRun();
    return h('section', { className: 'pf-card' },
      h('h3', null, '🧭 Career Path Agent'),
      h('div', { className: 'st-grid' },
        h(ui.Field, { id: 'st-c-cur', label: 'You are now' }, h(ui.Input, { id: 'st-c-cur', value: current, onChange: setCurrent, placeholder: 'Junior Marketing', maxLength: 200 })),
        h(ui.Field, { id: 'st-c-tgt', label: 'You want to be (optional)' }, h(ui.Input, { id: 'st-c-tgt', value: target, onChange: setTarget, placeholder: 'Marketing Manager', maxLength: 200 })),
        h(ui.Field, { id: 'st-c-sal', label: 'Target salary (THB / month)' }, h(ui.Input, { id: 'st-c-sal', type: 'number', value: salary, onChange: setSalary, placeholder: '60000' }))),
      h(Btn, { busy, disabled: !current.trim(), onClick: () => run(async () => setRes(await skill('career_path', { current_role: current, target_role: target, target_salary: Number(salary) || null }))) }, 'Build my 30-day plan'),
      h(Err, { text: error }),
      res && h('div', { className: 'st-out' },
        h('p', { className: 'st-label' }, 'The 3 skills that matter most'), h(List, { items: res.skills.map(s => `${s.skill}: ${s.why}`) }),
        ...res.plan.map(w => h('div', { key: w.week }, h('p', { className: 'st-label' }, `Week ${w.week}: ${w.focus}`), h(List, { items: w.tasks }))),
        h('p', { className: 'lab-tiny' }, res.salary_note)));
  }

  function Safety({ jobs, jobId, setJobId }) {
    const [txt, setTxt] = React.useState('');
    const [res, setRes] = React.useState(null);
    const { busy, error, run } = useRun();
    return h('section', { className: 'pf-card' },
      h('h3', null, '🛡️ Fake Job Detector'),
      h('p', { className: 'lab-tiny' }, 'Check a HireMeow job, or paste any ad from Facebook, LINE or another site.'),
      h(JobPicker, { id: 'st-f-job', value: jobId, onChange: setJobId, jobs, optional: true }),
      !jobId && h(ui.TextArea, { id: 'st-f-txt', value: txt, onChange: setTxt, rows: 5, maxLength: 12000, placeholder: 'Paste the job ad…' }),
      h(Btn, { busy, disabled: !jobId && txt.trim().length < 30, onClick: () => run(async () => setRes(await skill('fraud_check', jobId ? { job_id: jobId } : { text: txt }))) }, 'Check this job'),
      h(Err, { text: error }),
      res && h(RiskBox, { res }));
  }

  function Portfolio({ platform }) {
    const [resume, setResume] = React.useState({ text: '', file: null });
    const [data, setData] = React.useState(null);
    const [slug, setSlug] = React.useState('');
    const [saved, setSaved] = React.useState(null);
    const { busy, error, run } = useRun();
    React.useEffect(() => { (async () => {
      const sb = await getClient(); if (!sb || !platform.user) return;
      const { data: row } = await sb.from('portfolios').select('*').eq('id', platform.user.id).maybeSingle();
      if (row) { setData(row.data); setSlug(row.slug); setSaved(row); }
      else setSlug(((platform.profile?.full_name || 'meow').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'meow') + '-' + platform.user.id.slice(0, 4));
    })(); }, [platform.user?.id]);
    const save = published => run(async () => {
      if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) throw new Error('Link name: 3-40 lowercase letters, numbers or dashes.');
      const sb = await getClient();
      const { data: row, error: e } = await sb.from('portfolios').upsert({ id: platform.user.id, slug, data, published }).select().single();
      if (e) throw (/duplicate|unique/i.test(e.message) ? new Error('That link name is taken. Try another.') : e);
      setSaved(row);
    });
    const url = saved ? `${location.origin}/?portfolio=${saved.slug}` : '';
    return h('div', { className: 'st-stack' },
      h('section', { className: 'pf-card' },
        h('h3', null, '🌐 1-Click Portfolio'),
        h('p', { className: 'lab-tiny' }, 'Turns your resume into a clean portfolio page you can share. Phone number, address and ID details are left out.'),
        h(ResumeBox, { id: 'st-p-cv', value: resume, onChange: setResume }),
        h(Btn, { busy, disabled: !hasResume(resume), onClick: () => run(async () => setData(await skill('portfolio', resumeInput(resume)))) }, data ? 'Rebuild from resume' : 'Build my portfolio'),
        h(Err, { text: error })),
      data && h('section', { className: 'pf-card' },
        h('div', { className: 'lab-row' },
          h(ui.Field, { id: 'st-p-slug', label: 'Link name', hint: `${location.origin}/?portfolio=${slug || '…'}` }, h(ui.Input, { id: 'st-p-slug', value: slug, onChange: v => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '')), maxLength: 40 })),
          h('button', { type: 'button', className: 'lab-btn', disabled: busy, onClick: () => save(true) }, saved?.published ? 'Save & keep live' : 'Publish'),
          saved?.published && h('button', { type: 'button', className: 'lab-btn-ghost', disabled: busy, onClick: () => save(false) }, 'Unpublish')),
        saved?.published && h('p', null, '✅ Live at ', h('a', { href: url, target: '_blank', rel: 'noopener' }, url), ' ', h(CopyBtn, { text: url, label: 'Copy link' })),
        h('p', { className: 'st-label' }, 'Preview'),
        h(PortfolioView, { data })));
  }

  function FollowUps({ platform }) {
    const [apps, setApps] = React.useState(null);
    const [drafts, setDrafts] = React.useState({});
    const [language, setLanguage] = React.useState('en');
    const { busy, error, run } = useRun();
    React.useEffect(() => { (async () => {
      const sb = await getClient(); if (!sb) return;
      const { data } = await sb.from('applications').select('id,status,created_at,ghosting_last_reply_at,jobs(title,companies(name))').eq('student_id', platform.user.id).order('created_at', { ascending: false });
      setApps(data || []);
    })(); }, [platform.user?.id]);
    const days = a => Math.floor((Date.now() - new Date(a.ghosting_last_reply_at || a.created_at)) / 86400000);
    const open = (apps || []).filter(a => ['applied', 'viewed', 'shortlisted', 'interview'].includes(a.status));
    return h('section', { className: 'pf-card' },
      h('div', { className: 'lab-row lab-between' }, h('h3', null, '📬 Application Tracker'), h(ui.Select, { id: 'st-fu-lang', value: language, onChange: setLanguage, options: [['en', 'Emails in English'], ['th', 'Emails in Thai']] })),
      h(Err, { text: error }),
      apps === null ? h('p', null, 'Loading…') : !open.length ? h(ui.Empty, { icon: '📭' }, 'No open applications. Apply to a job and I’ll keep an eye on it.') :
      h('ul', { className: 'pf-list' }, ...open.map(a => {
        const d = days(a); const draft = drafts[a.id];
        return h('li', { key: a.id, className: 'st-fu' },
          h('div', null, h('strong', null, `${a.jobs?.title} · ${a.jobs?.companies?.name}`), h('small', null, ` · status: ${ui.label(a.status)} · sent ${fmtDate(a.created_at)} · ${d} day${d === 1 ? '' : 's'} without a reply`)),
          d >= 3 ? h('button', { type: 'button', className: 'lab-btn-ghost pd-small', disabled: busy, onClick: () => run(async () => { const r = await skill('follow_up', { application_id: a.id, language }); setDrafts(x => ({ ...x, [a.id]: r })); }) }, `You applied ${d} days ago. Want me to draft a follow-up email?`) : h('small', { className: 'pf-muted' }, 'Too early to follow up. Give them a few days.'),
          draft && h('div', null, h(Out, { title: draft.subject, text: draft.email }),
            draft.to && h('a', { className: 'lab-btn-ghost pd-small', href: `mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.email)}` }, 'Open in my email app')));
      })));
  }

  const TABS = [['match', '🎯 Match & Tailor'], ['letters', '✉️ Cover letter & Intro'], ['interview', '🎙️ Interview'], ['score', '🐱 Meow Score & Roast'], ['track', '📬 Tracker'], ['money', '💰 Salary & Offer'], ['career', '🧭 Career path'], ['safety', '🛡️ Fake job check'], ['portfolio', '🌐 Portfolio']];
  function Studio({ platform, onOpenAuth }) {
    const [tab, setTab] = React.useState('match');
    const [jobId, setJobId] = React.useState('');
    const jobs = useJobs();
    React.useEffect(() => {
      const go = d => { if (!d) return; if (d.jobId) setJobId(d.jobId); if (d.tab) setTab(d.tab); setTimeout(() => document.getElementById('meow-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); };
      const onEvt = e => go(e.detail);
      window.addEventListener('hiremeow:studio', onEvt);
      if (window.__hmStudio) { go(window.__hmStudio); window.__hmStudio = null; }
      return () => window.removeEventListener('hiremeow:studio', onEvt);
    }, []);
    if (!platform.ready || !platform.live) return null;
    const head = h('div', { className: 'st-head' }, h('p', { className: 'hm-eyebrow' }, 'MEOW AI STUDIO · NEW'), h('h2', null, 'Your AI job-hunting toolkit'));
    if (!platform.user) return h('section', { id: 'meow-studio', className: 'st' }, head, h('div', { className: 'pf-card pf-signin-card' }, h('p', null, 'Sign in to tailor your resume, practise interviews, check job offers and more.'), h('button', { type: 'button', className: 'lab-btn', onClick: () => onOpenAuth('student') }, 'Sign in or join')));
    if (platform.profile && platform.profile.role !== 'student') return null;
    const props = { jobs, platform, jobId, setJobId };
    return h('section', { id: 'meow-studio', className: 'st' }, head,
      h('div', { className: 'lab-tabs st-tabs', role: 'tablist', 'aria-label': 'AI Studio tools' }, ...TABS.map(([id, label]) => h('button', { key: id, role: 'tab', 'aria-selected': tab === id, className: tab === id ? 'on' : '', onClick: () => setTab(id) }, label))),
      h('p', { className: 'lab-tiny' }, 'Uses HireMeow’s AI (OpenAI). Your text and files are sent only to get the result and aren’t stored by HireMeow. Always check AI output before you send it.'),
      h('div', { role: 'tabpanel' },
        tab === 'match' ? h(MatchTailor, props) : tab === 'letters' ? h(Letters, props) : tab === 'interview' ? h(Interview, props) :
        tab === 'score' ? h(ScoreRoast, props) : tab === 'track' ? h(FollowUps, props) : tab === 'money' ? h(Money) :
        tab === 'career' ? h(Career) : tab === 'safety' ? h(Safety, props) : h(Portfolio, props)));
  }

  // ---------- job card tools ----------
  function JobChat({ job, onClose }) {
    const [msgs, setMsgs] = React.useState([]);
    const [q, setQ] = React.useState('');
    const { busy, error, run } = useRun();
    const send = t => {
      const text = (t ?? q).trim(); if (!text || busy) return;
      const next = [...msgs, { role: 'user', content: text }]; setMsgs(next); setQ('');
      run(async () => { const r = await api('/api/job-chat', { method: 'POST', body: { job_id: job.id, messages: next } }); setMsgs(m => [...m, { role: 'assistant', content: r.result.answer + (r.result.needs_recruiter ? ' (You can ask the recruiter after you apply.)' : '') }]); });
    };
    return h('div', { className: 'st-chat' },
      h('div', { className: 'lab-row lab-between' }, h('strong', null, '💬 Ask about this job'), h('button', { type: 'button', className: 'ma-linkbtn', onClick: onClose }, 'Close')),
      !msgs.length && h('div', { className: 'lab-row' }, ...['What’s the team size?', 'Is it remote?', 'What’s the hiring process?'].map(s => h('button', { key: s, type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => send(s) }, s))),
      ...msgs.map((m, i) => h('p', { key: i, className: 'st-msg st-' + m.role }, m.content)),
      busy && h('p', { className: 'st-msg st-assistant' }, '…'),
      h(Err, { text: error }),
      h('form', { className: 'lab-row', onSubmit: e => { e.preventDefault(); send(); } }, h(ui.Input, { id: 'jc-' + job.id, value: q, onChange: setQ, placeholder: 'Your question', maxLength: 500 }), h('button', { type: 'submit', className: 'lab-btn pd-small', disabled: busy || !q.trim() }, 'Ask')),
      h('p', { className: 'lab-tiny' }, 'AI answers from this job ad and the recruiter’s FAQ only.'));
  }
  function JobAiTools({ job, platform, onOpenAuth, onNavigate }) {
    const [chat, setChat] = React.useState(false);
    const [risk, setRisk] = React.useState(null);
    const { busy, error, run } = useRun();
    const student = platform.profile?.role === 'student';
    const m = student ? matchJob(job, platform.profile) : null;
    const toStudio = tab => { window.__hmStudio = { jobId: job.id, tab }; onNavigate?.('lab'); setTimeout(() => { if (window.__hmStudio) window.dispatchEvent(new CustomEvent('hiremeow:studio', { detail: window.__hmStudio })); }, 400); };
    return h('div', { className: 'st-jobtools' },
      m && h('p', { className: 'st-match' }, '🎯 ' + matchSentence(m)),
      h('div', { className: 'lab-row' },
        h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => setChat(!chat), 'aria-expanded': chat }, '💬 Ask about this job'),
        platform.user ? h('button', { type: 'button', className: 'lab-btn-ghost pd-small', disabled: busy, onClick: () => run(async () => setRisk(await skill('fraud_check', { job_id: job.id }))) }, busy ? 'Checking…' : '🛡️ Safety check')
          : h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => onOpenAuth?.() }, '🛡️ Sign in for a safety check'),
        student && h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => toStudio('match') }, '🪄 Tailor my resume'),
        student && h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => toStudio('letters') }, '✉️ Cover letter'),
        student && h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: () => toStudio('interview') }, '🎙️ Practise interview')),
      h(Err, { text: error }),
      risk && h(RiskBox, { res: risk }),
      chat && h(JobChat, { job, onClose: () => setChat(false) }));
  }

  // ---------- portfolio page ----------
  const safeUrl = u => (/^https?:\/\/[^\s]+$/i.test(u || '') ? u : null);
  function PortfolioView({ data }) {
    return h('article', { className: 'pt' },
      h('header', { className: 'pt-head' }, h('h1', null, data.name || 'Portfolio'), data.headline && h('p', { className: 'pt-headline' }, data.headline),
        data.links?.some(l => safeUrl(l.url)) && h('p', { className: 'pt-links' }, ...data.links.filter(l => safeUrl(l.url)).map((l, i) => h('a', { key: i, href: safeUrl(l.url), target: '_blank', rel: 'noopener noreferrer nofollow' }, l.label || l.url)))),
      data.about && h('section', null, h('h2', null, 'About'), h('p', null, data.about)),
      data.skills?.length > 0 && h('section', null, h('h2', null, 'Skills'), h('div', { className: 'pf-chips' }, ...data.skills.map((s, i) => h('span', { key: i, className: 'pf-chip' }, s)))),
      data.experience?.length > 0 && h('section', null, h('h2', null, 'Experience'), ...data.experience.map((x, i) => h('div', { key: i, className: 'pt-item' }, h('h3', null, x.role, x.org && h('span', null, ' · ' + x.org)), x.period && h('small', null, x.period), h(List, { items: x.highlights })))),
      data.projects?.length > 0 && h('section', null, h('h2', null, 'Projects'), ...data.projects.map((x, i) => h('div', { key: i, className: 'pt-item' }, h('h3', null, safeUrl(x.link) ? h('a', { href: safeUrl(x.link), target: '_blank', rel: 'noopener noreferrer nofollow' }, x.name) : x.name), h('p', null, x.description)))),
      data.education?.length > 0 && h('section', null, h('h2', null, 'Education'), ...data.education.map((x, i) => h('div', { key: i, className: 'pt-item' }, h('h3', null, x.school), h('small', null, [x.degree, x.year].filter(Boolean).join(' · '))))));
  }
  function PortfolioPage({ slug }) {
    const [row, setRow] = React.useState(undefined);
    React.useEffect(() => { (async () => {
      const sb = await getClient();
      if (!sb) { setRow(null); return; }
      const { data } = await sb.from('portfolios').select('slug,data,published').eq('slug', slug).eq('published', true).maybeSingle();
      setRow(data || null);
      if (data?.data?.name) document.title = `${data.data.name} · HireMeow portfolio`;
    })(); }, [slug]);
    return h('main', { className: 'pt-page' },
      row === undefined ? h('p', null, 'Loading…') : !row ? h(ui.Empty, { icon: '🙀' }, 'This portfolio isn’t published.') : h(PortfolioView, { data: row.data }),
      h('p', { className: 'pt-foot' }, h('a', { href: '/' }, '🐾 Made with HireMeow · build yours free')));
  }

  // ---------- recruiter copilot ----------
  function Screener({ jobs, sb }) {
    const [jobId, setJobId] = React.useState(jobs[0]?.id || '');
    const [apps, setApps] = React.useState([]);
    const [files, setFiles] = React.useState([]);
    const [results, setResults] = React.useState([]);
    const [progress, setProgress] = React.useState(null);
    const [error, setError] = React.useState('');
    const stop = React.useRef(false);
    React.useEffect(() => {
      if (!jobId) return;
      setResults([]); setProgress(null);
      sb.from('applications').select('id').eq('job_id', jobId).neq('status', 'withdrawn').limit(500).then(({ data }) => setApps(data || []));
    }, [jobId]);
    const addFiles = async e => {
      const list = [...(e.target.files || [])]; e.target.value = '';
      const out = []; const bad = [];
      for (const f of list.slice(0, 500)) { try { out.push(await readFile(f)); } catch (x) { bad.push(`${f.name}: ${x.message}`); } }
      setError(bad.slice(0, 3).join(' · ') + (bad.length > 3 ? ` (+${bad.length - 3} more)` : ''));
      setFiles(prev => [...prev, ...out].slice(0, 500));
    };
    const start = async () => {
      stop.current = false; setError(''); setResults([]);
      const batches = [];
      for (let i = 0; i < apps.length; i += 10) batches.push({ application_ids: apps.slice(i, i + 10).map(a => a.id) });
      for (let i = 0; i < files.length; i += 4) batches.push({ files: files.slice(i, i + 4).map(f => (f.kind === 'pdf' ? { name: f.name, data: f.data } : { name: f.name, text: f.text })) });
      const total = apps.length + files.length; let done = 0;
      setProgress({ done, total });
      for (const b of batches) {
        if (stop.current) break;
        for (let tries = 0; ; tries++) {
          try { const r = await skill('screen', { job_id: jobId, ...b }); setResults(prev => [...prev, ...r.candidates].sort((x, y) => y.score - x.score)); break; }
          catch (e) { if (e.status === 429 && tries < 3) { await new Promise(r => setTimeout(r, 20000)); continue; } setError(friendlyError(e)); break; }
        }
        done += (b.application_ids?.length || 0) + (b.files?.length || 0); setProgress({ done, total });
      }
      setProgress(p => ({ ...p, finished: true }));
    };
    const top = results.slice(0, 20);
    const csv = () => download('meow-screener-top20.csv', ['rank,name,score,salary_expectation,strengths,red_flags,summary', ...top.map((c, i) => [i + 1, c.name || c.ref, c.score, c.salary_expectation, c.strengths.join('; '), c.red_flags.join('; '), c.summary].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n'));
    const running = progress && !progress.finished;
    return h('section', { className: 'pf-card' },
      h('h3', null, '🔎 AI Screener'),
      h('p', { className: 'lab-tiny' }, 'Screens this job’s HireMeow applicants plus any resumes you upload, and ranks the Top 20. It judges skills and experience only, never nationality, age, gender, religion or photos. You make the final decision.'),
      h(ui.Field, { id: 'cp-sc-job', label: 'Job' }, h(ui.Select, { id: 'cp-sc-job', value: jobId, onChange: setJobId, options: jobs.map(j => [j.id, j.title]) })),
      h('div', { className: 'lab-row' },
        h('span', null, `${apps.length} HireMeow applicant${apps.length === 1 ? '' : 's'} · ${files.length} uploaded resume${files.length === 1 ? '' : 's'}`),
        h('label', { className: 'lab-btn-ghost pd-small st-upload' }, '⬆ Upload resumes (PDF/.txt, up to 500)', h('input', { type: 'file', multiple: true, accept: '.pdf,.txt,application/pdf,text/plain', onChange: addFiles, hidden: true })),
        files.length > 0 && !running && h('button', { type: 'button', className: 'ma-linkbtn', onClick: () => setFiles([]) }, 'Clear uploads')),
      h('div', { className: 'lab-row' },
        h('button', { type: 'button', className: 'lab-btn', disabled: !jobId || (!apps.length && !files.length) || running, onClick: start }, running ? 'Screening…' : 'Screen candidates'),
        running && h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => { stop.current = true; } }, 'Stop')),
      progress && h('p', { className: 'lab-tiny', role: 'status' }, progress.finished ? `Done: screened ${progress.done} of ${progress.total}.` : `Screening… ${progress.done} of ${progress.total}`),
      error && h(ui.Notice, { tone: 'error' }, error),
      top.length > 0 && h(React.Fragment, null,
        h('div', { className: 'lab-row lab-between' }, h('strong', null, `Top ${top.length}`), h('button', { type: 'button', className: 'lab-btn-ghost pd-small', onClick: csv }, 'Download CSV')),
        h('ol', { className: 'cp-rank' }, ...top.map(c => h('li', { key: c.ref },
          h('div', { className: 'lab-row lab-between' }, h('strong', null, c.name || c.ref.replace(/^file:/, '')), h('span', { className: 'ma-score' }, c.score)),
          h('p', null, c.summary),
          c.strengths.length > 0 && h('p', { className: 'lab-tiny' }, '💪 ' + c.strengths.join(' · ')),
          c.red_flags.length > 0 && h('p', { className: 'lab-tiny cp-flag' }, '🚩 ' + c.red_flags.join(' · ')),
          h('p', { className: 'lab-tiny' }, '💰 Salary expectation: ' + c.salary_expectation),
          c.ref.startsWith('file:') && h('p', { className: 'lab-tiny' }, '📄 Uploaded resume: ' + c.ref.slice(5)))))));
  }
  function TalentPool({ jobs }) {
    const [jobId, setJobId] = React.useState(jobs[0]?.id || '');
    const [res, setRes] = React.useState(null);
    const { busy, error, run } = useRun();
    const n = res?.candidates.length || 0;
    return h('section', { className: 'pf-card' },
      h('h3', null, '⛏️ Talent Pool Miner'),
      h('p', { className: 'lab-tiny' }, 'Finds people who applied to your other jobs (including ones you turned down) who fit this job.'),
      h(ui.Field, { id: 'cp-tp-job', label: 'New job' }, h(ui.Select, { id: 'cp-tp-job', value: jobId, onChange: v => { setJobId(v); setRes(null); }, options: jobs.map(j => [j.id, j.title]) })),
      h(Btn, { busy, disabled: !jobId, onClick: () => run(async () => setRes(await skill('talent_pool', { job_id: jobId }))) }, 'Find hidden matches'),
      h(Err, { text: error }),
      res && (n ? h(React.Fragment, null,
        h('p', { className: 'st-big' }, `${n} past applicant${n === 1 ? '' : 's'} look${n === 1 ? 's' : ''} right for this job.`),
        h('ul', { className: 'pf-list' }, ...res.candidates.map(c => h('li', { key: c.student_id, className: 'st-fu' },
          h('strong', null, `${c.name} · fit ${c.score}`), h('small', null, ` Applied to ${c.previous_job} ${c.days_ago} days ago (${c.previous_status})${c.open_to_offers ? ' · open to offers' : ''}`), h('p', { className: 'lab-tiny' }, c.why)))),
        h('p', { className: 'lab-tiny' }, 'Reach students who are open to offers through Reverse Hiring.'))
        : h(ui.Empty, { icon: '🐾' }, res.note || 'No strong matches yet.')));
  }
  function Copilot({ jobs, sb }) {
    const [tab, setTab] = React.useState('screen');
    if (!jobs.length) return h(ui.Empty, { icon: '📝' }, 'Post a job first. Tip: use “✨ Write with AI” in the job editor.');
    return h('div', { className: 'pf-stack' },
      h('div', { className: 'lab-tabs', role: 'tablist' }, ...[['screen', '🔎 AI Screener'], ['pool', '⛏️ Talent Pool Miner']].map(([id, t]) => h('button', { key: id, className: tab === id ? 'on' : '', 'aria-selected': tab === id, role: 'tab', onClick: () => setTab(id) }, t))),
      h('p', { className: 'lab-tiny' }, 'Also part of Meow Copilot: ✨ Write with AI in the job editor, and a 24/7 candidate chatbot on every job that answers from your ad and the Candidate FAQ you add.'),
      tab === 'screen' ? h(Screener, { jobs, sb }) : h(TalentPool, { jobs }));
  }
  function JdWriter({ onApply }) {
    const [brief, setBrief] = React.useState('');
    const [res, setRes] = React.useState(null);
    const { busy, error, run } = useRun();
    return h('div', { className: 'st-out cp-jd' },
      h('strong', null, '✨ Write with AI'),
      h('p', { className: 'lab-tiny' }, 'Describe the role in a few words. You’ll get a full job description, a Bangkok salary suggestion and candidate FAQ answers to review.'),
      h('div', { className: 'lab-row' }, h(ui.Input, { id: 'cp-jd-brief', value: brief, onChange: setBrief, placeholder: 'e.g. need junior marketing, TikTok, Thai + English, near Asok', maxLength: 2000 }),
        h('button', { type: 'button', className: 'lab-btn pd-small', disabled: busy || brief.trim().length < 5, onClick: () => run(async () => setRes(await skill('jd_writer', { brief }))) }, busy ? 'Writing…' : 'Write it')),
      h(Err, { text: error }),
      res && h(React.Fragment, null,
        h('p', null, h('b', null, res.title), ` · suggested ${baht(res.salary_min)} – ${baht(res.salary_max)} / month`),
        h('p', { className: 'lab-tiny' }, (res.salary_source === 'hiremeow_data' ? `Based on ${res.data?.count} similar HireMeow listings. ` : 'AI estimate (not enough HireMeow data yet). ') + res.salary_note),
        h('pre', { className: 'st-pre' }, res.description),
        h('div', { className: 'lab-row' }, h('button', { type: 'button', className: 'lab-btn pd-small', onClick: () => onApply(res) }, 'Use this in the form'), h(CopyBtn, { text: res.description }))));
  }

  return { Studio, JobAiTools, PortfolioPage, Copilot, JdWriter };
}
