// Shared skill dictionary + deterministic job matching (used by the server agent and the browser).
// Match % is computed, not guessed: skills named in the job ad vs skills on the profile.
export const SKILLS = {
  // tech
  'javascript': ['javascript', 'js'], 'typescript': ['typescript'], 'react': ['react', 'react.js', 'reactjs'], 'vue': ['vue', 'vue.js'], 'angular': ['angular'],
  'node.js': ['node.js', 'nodejs', 'node'], 'python': ['python'], 'java': ['java'], 'c#': ['c#', '.net', 'dotnet'], 'php': ['php', 'laravel'], 'go': ['golang'],
  'sql': ['sql', 'mysql', 'postgres', 'postgresql'], 'excel': ['excel', 'spreadsheets'], 'power bi': ['power bi', 'powerbi'], 'tableau': ['tableau'],
  'aws': ['aws', 'amazon web services'], 'azure': ['azure'], 'gcp': ['gcp', 'google cloud'], 'docker': ['docker'], 'kubernetes': ['kubernetes', 'k8s'],
  'git': ['git', 'github'], 'html/css': ['html', 'css'], 'figma': ['figma'], 'ui/ux': ['ui/ux', 'ux', 'user experience'], 'machine learning': ['machine learning', 'ml'],
  'data analysis': ['data analysis', 'analytics', 'data analyst'], 'flutter': ['flutter'], 'swift': ['swift', 'ios'], 'kotlin': ['kotlin', 'android'],
  'sap': ['sap'], 'salesforce': ['salesforce'], 'api': ['api', 'rest api'], 'qa/testing': ['qa', 'testing', 'test automation'],
  // business
  'digital marketing': ['digital marketing', 'online marketing'], 'seo': ['seo'], 'social media': ['social media', 'tiktok', 'instagram', 'facebook ads'],
  'content writing': ['content writing', 'copywriting', 'content creation'], 'google ads': ['google ads', 'sem', 'ppc'], 'crm': ['crm', 'hubspot'],
  'sales': ['sales', 'business development'], 'customer service': ['customer service', 'customer support'], 'project management': ['project management', 'pmp', 'scrum', 'agile'],
  'accounting': ['accounting', 'bookkeeping'], 'finance': ['finance', 'financial analysis'], 'hr': ['human resources', 'recruitment', 'talent acquisition'],
  'supply chain': ['supply chain', 'logistics', 'procurement'], 'operations': ['operations'], 'autocad': ['autocad', 'cad'], 'solidworks': ['solidworks'],
  'lean/six sigma': ['lean', 'six sigma', 'kaizen'], 'graphic design': ['graphic design', 'photoshop', 'illustrator', 'canva'], 'video editing': ['video editing', 'premiere', 'capcut'],
  'teaching': ['teaching', 'tefl', 'tesol'], 'hospitality': ['hospitality', 'hotel', 'front office'],
  // languages
  'english': ['english', 'ielts', 'toeic', 'toefl'], 'thai': ['thai language', 'thai speaking', 'speak thai', 'thai'], 'chinese': ['chinese', 'mandarin', 'hsk'],
  'japanese': ['japanese', 'jlpt'], 'burmese': ['burmese', 'myanmar language']
};

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = Object.entries(SKILLS).map(([name, alts]) => [name, new RegExp('(^|[^a-z0-9+#])(' + alts.map(esc).join('|') + ')(?![a-z0-9+#])', 'i')]);

export function skillsIn(text) {
  const t = String(text || '').toLowerCase();
  return PATTERNS.filter(([, re]) => re.test(t)).map(([n]) => n);
}

export function normalizeSkills(list) {
  const out = new Set();
  for (const s of list || []) { const found = skillsIn(s); if (found.length) found.forEach(f => out.add(f)); else if (String(s).trim()) out.add(String(s).trim().toLowerCase()); }
  return [...out];
}

/** Returns { percent, have, missing, notes } or null when the job lists no recognisable skills. */
export function matchJob(job, profile) {
  const needed = skillsIn(`${job?.title || ''} ${job?.description || ''}`);
  const mine = new Set(normalizeSkills([...(profile?.skills || []), profile?.languages || '', profile?.headline || '', profile?.field_of_study || '']));
  const have = needed.filter(s => mine.has(s));
  const missing = needed.filter(s => !mine.has(s));
  const notes = [];
  let percent;
  if (needed.length) percent = Math.round(35 + 55 * (have.length / needed.length));
  else percent = 50;
  const years = profile?.grad_year ? new Date().getFullYear() - Number(profile.grad_year) : null;
  const wantYears = Number((String(job?.description || '').match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i) || [])[1]);
  if (wantYears && years !== null) {
    if (years >= wantYears) { percent += 5; notes.push(`about ${years} year${years === 1 ? '' : 's'} since graduating (job asks ${wantYears}+)`); }
    else { percent -= 10; notes.push(`job asks ${wantYears}+ years; you graduated about ${Math.max(0, years)} year${years === 1 ? '' : 's'} ago`); }
  }
  if (profile?.desired_salary_min && job?.salary_max) {
    if (job.salary_max >= profile.desired_salary_min) { percent += 5; notes.push('pay meets your target'); }
    else { percent -= 5; notes.push('pay is below your target'); }
  }
  percent = Math.max(5, Math.min(99, percent));
  return { percent, have, missing, notes, skills_listed: needed.length };
}

export function matchSentence(m) {
  if (!m) return '';
  const why = [];
  if (m.have.length) why.push('you have ' + m.have.slice(0, 4).join(' + '));
  why.push(...m.notes.slice(0, 2));
  let s = `${m.percent}% match` + (why.length ? ' because ' + why.join(', ') : '');
  if (m.missing.length) s += `. Missing: ${m.missing.slice(0, 4).join(', ')}`;
  else if (!m.skills_listed) s += '. The ad lists no specific skills';
  return s + '.';
}
