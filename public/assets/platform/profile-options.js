// Dropdown choices for the student profile, plus two small pickers:
// PickOne (dropdown with an "Other" option) and PickMany (searchable multi-select with chips).
export const OTHER = '__other__';

export const NATIONALITIES = ['Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabe', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comorian', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Eswatini', 'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hong Konger', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakh', 'Kenyan', 'Kiribati', 'Kosovar', 'Kuwaiti', 'Kyrgyz', 'Lao', 'Latvian', 'Lebanese', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish', 'Macanese', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monegasque', 'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican', 'Myanmar (Burmese)', 'Namibian', 'Nauruan', 'Nepali', 'New Zealander', 'Nicaraguan', 'Nigerian', 'Nigerien', 'North Korean', 'North Macedonian', 'Norwegian', 'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan', 'San Marinese', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander', 'Somali', 'South African', 'South Korean', 'South Sudanese', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Timorese', 'Togolese', 'Tongan', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek', 'Vanuatuan', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean'];
export const NATIONALITY_TOP = ['Myanmar (Burmese)', 'Chinese', 'Indian', 'Cambodian', 'Lao', 'Vietnamese', 'Filipino', 'Indonesian', 'Bangladeshi', 'Nepali', 'Bhutanese', 'Japanese', 'South Korean', 'Malaysian'];
export const NATIONALITY_GROUPS = [['Most common on HireMeow', NATIONALITY_TOP], ['All nationalities (A–Z)', NATIONALITIES.filter(n => !NATIONALITY_TOP.includes(n))]];

export const UNIVERSITIES = [
  ['Public universities', ['Chulalongkorn University', 'Mahidol University', 'Mahidol University International College (MUIC)', 'Thammasat University', 'Sirindhorn International Institute of Technology (SIIT), Thammasat', 'Kasetsart University', 'Chiang Mai University', 'Khon Kaen University', 'Prince of Songkla University', 'King Mongkut’s University of Technology Thonburi (KMUTT)', 'King Mongkut’s Institute of Technology Ladkrabang (KMITL)', 'King Mongkut’s University of Technology North Bangkok (KMUTNB)', 'Srinakharinwirot University', 'Silpakorn University', 'Burapha University', 'Naresuan University', 'Mae Fah Luang University', 'Suranaree University of Technology', 'Walailak University', 'Mahasarakham University', 'Ubon Ratchathani University', 'University of Phayao', 'Thaksin University', 'Maejo University', 'National Institute of Development Administration (NIDA)', 'Navamindradhiraj University', 'Chulabhorn Royal Academy', 'Princess of Naradhiwas University', 'Nakhon Phanom University', 'Kalasin University', 'Ramkhamhaeng University', 'Sukhothai Thammathirat Open University', 'Pathumwan Institute of Technology', 'Mahachulalongkornrajavidyalaya University', 'Mahamakut Buddhist University']],
  ['Rajamangala & Rajabhat universities', ['Rajamangala University of Technology Thanyaburi', 'Rajamangala University of Technology Krungthep', 'Rajamangala University of Technology Phra Nakhon', 'Rajamangala University of Technology Rattanakosin', 'Rajamangala University of Technology Suvarnabhumi', 'Rajamangala University of Technology Tawan-ok', 'Rajamangala University of Technology Lanna', 'Rajamangala University of Technology Isan', 'Rajamangala University of Technology Srivijaya', 'Suan Sunandha Rajabhat University', 'Suan Dusit University', 'Phranakhon Rajabhat University', 'Chandrakasem Rajabhat University', 'Bansomdejchaopraya Rajabhat University', 'Dhonburi Rajabhat University', 'Chiang Mai Rajabhat University', 'Other Rajabhat University']],
  ['Private universities', ['Assumption University (ABAC)', 'Bangkok University', 'Rangsit University', 'Sripatum University', 'Siam University', 'Dhurakij Pundit University', 'University of the Thai Chamber of Commerce (UTCC)', 'Stamford International University', 'Webster University Thailand', 'Mahanakorn University of Technology', 'Kasem Bundit University', 'Huachiew Chalermprakiet University', 'Payap University', 'Christian University of Thailand', 'Saint John’s University', 'Thai-Nichi Institute of Technology', 'Panyapiwat Institute of Management', 'Krirk University', 'Shinawatra University', 'Asia-Pacific International University', 'Eastern Asia University', 'Vongchavalitkul University', 'North-Chiang Mai University', 'Hatyai University', 'Rattana Bundit University', 'Southeast Asia University', 'Western University']],
  ['International institutes', ['Asian Institute of Technology (AIT)', 'Sasin School of Management']],
  ['Outside Thailand', ['University outside Thailand']]
];
export const ALL_UNIVERSITIES = UNIVERSITIES.flatMap(([, list]) => list);

export const FIELDS = [
  ['Business', ['Business Administration', 'Marketing', 'Digital Marketing', 'Finance', 'Accounting', 'Economics', 'International Business', 'Management', 'Human Resource Management', 'Logistics & Supply Chain', 'Entrepreneurship', 'Hospitality & Tourism', 'Real Estate']],
  ['Technology', ['Computer Science', 'Software Engineering', 'Information Technology', 'Data Science', 'Artificial Intelligence', 'Cybersecurity', 'Information Systems', 'Digital Media & Game Design']],
  ['Engineering', ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Industrial Engineering', 'Chemical Engineering', 'Computer Engineering', 'Automotive Engineering', 'Aerospace Engineering', 'Petroleum & Energy Engineering', 'Mechatronics & Robotics']],
  ['Science & health', ['Biology', 'Biotechnology', 'Chemistry', 'Physics', 'Mathematics & Statistics', 'Environmental Science', 'Food Science', 'Agriculture', 'Medicine', 'Nursing', 'Pharmacy', 'Public Health', 'Dentistry', 'Veterinary Science']],
  ['Arts, media & society', ['Communication Arts', 'Journalism', 'Graphic Design', 'Architecture', 'Interior Design', 'Fashion Design', 'Fine Arts', 'Music', 'Film & Media', 'English', 'Thai Studies', 'Chinese Studies', 'Japanese Studies', 'Linguistics', 'Education / Teaching (TESOL)', 'Political Science', 'International Relations', 'Law', 'Psychology', 'Sociology', 'Social Work', 'Development Studies']]
];
export const ALL_FIELDS = FIELDS.flatMap(([, list]) => list);

export const LANGUAGES = ['English', 'Thai', 'Burmese', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Hindi', 'Khmer', 'Lao', 'Vietnamese', 'Filipino (Tagalog)', 'Indonesian', 'Malay', 'Bengali', 'Nepali', 'Japanese', 'Korean', 'Arabic', 'French', 'German', 'Spanish', 'Portuguese', 'Russian', 'Italian', 'Dutch', 'Turkish', 'Urdu', 'Tamil', 'Telugu', 'Punjabi', 'Marathi', 'Shan', 'Karen', 'Mon', 'Persian (Farsi)', 'Sinhala', 'Mongolian', 'Kazakh', 'Uzbek', 'Swahili', 'Polish', 'Ukrainian', 'Greek', 'Hebrew', 'Swedish'];
export const LEVELS = ['Native', 'Fluent', 'Business', 'Conversational', 'Basic'];

export const SKILL_GROUPS = [
  ['Office & data', ['Microsoft Excel', 'Microsoft Word', 'PowerPoint', 'Google Workspace', 'Data Analysis', 'Power BI', 'Tableau', 'SQL', 'Looker Studio', 'Statistics']],
  ['Tech & development', ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C#', 'PHP', 'HTML/CSS', 'Flutter', 'Swift', 'Kotlin', 'Git', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Machine Learning', 'QA / Testing', 'API Integration', 'Cybersecurity']],
  ['Design & content', ['Figma', 'UI/UX Design', 'Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Video Editing', 'CapCut', 'Premiere Pro', 'Photography', 'Content Writing', 'Copywriting']],
  ['Marketing & sales', ['Digital Marketing', 'Social Media Marketing', 'TikTok Marketing', 'SEO', 'Google Ads', 'Facebook Ads', 'E-commerce (Shopee / Lazada)', 'CRM (HubSpot / Salesforce)', 'Sales', 'Business Development', 'Market Research', 'Customer Service']],
  ['Business & operations', ['Project Management', 'Agile / Scrum', 'Accounting', 'Financial Analysis', 'Bookkeeping', 'SAP', 'Supply Chain', 'Logistics', 'Procurement', 'Import / Export', 'Recruitment', 'HR Administration', 'Event Management', 'Operations']],
  ['Engineering & industry', ['AutoCAD', 'SolidWorks', 'MATLAB', 'PLC Programming', 'Lean / Six Sigma', 'Quality Control', 'Electrical Design', 'Construction Management']],
  ['People skills', ['Teaching / Tutoring', 'Public Speaking', 'Translation / Interpreting', 'Leadership', 'Teamwork', 'Problem Solving', 'Negotiation', 'Hospitality']]
];
export const ALL_SKILLS = SKILL_GROUPS.flatMap(([, list]) => list);

export const VISAS = [
  ['Study', ['Non-Immigrant ED Plus', 'Non-Immigrant ED', 'ED Plus graduate job-search extension']],
  ['Work & business', ['Non-Immigrant B (Employment)', 'SMART Visa', 'Long-Term Resident (LTR)', 'Destination Thailand Visa (DTV)']],
  ['Other stays', ['Non-Immigrant O (Family / Dependant)', 'Tourist visa', 'Visa exemption', 'Permanent residence', 'Thai citizen']],
  ['Not yet', ['Not in Thailand yet', 'Not sure']]
];
export const ALL_VISAS = VISAS.flatMap(([, list]) => list);

export const gradYears = (now = new Date().getFullYear()) => Array.from({ length: now + 6 - 1980 + 1 }, (_, i) => String(now + 6 - i));

// "English (Fluent), Thai (Basic)" <-> [{ name, level }]
export function parseLanguages(text) {
  return String(text || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)\s*\((Native|Fluent|Business|Conversational|Basic)\)$/i);
    return m ? { name: m[1].trim(), level: LEVELS.find(l => l.toLowerCase() === m[2].toLowerCase()) } : { name: s, level: '' };
  });
}
export const formatLanguages = list => list.filter(l => l.name).map(l => (l.level ? `${l.name} (${l.level})` : l.name)).join(', ');

export function createPickers(React) {
  const h = React.createElement;
  const opt = v => h('option', { key: v, value: v }, v);
  const optionsOf = (groups, options) => (options ? options.map(opt) : groups.map(([label, list]) => h('optgroup', { key: label, label }, ...list.map(opt))));

  /** Dropdown with optional groups and an "Other" choice that reveals a text box. */
  function PickOne({ id, value, onChange, groups, options, placeholder = 'Choose…', otherLabel = 'Other (type it)', maxLength = 120 }) {
    const known = options || groups.flatMap(([, l]) => l);
    const [other, setOther] = React.useState(Boolean(value) && !known.includes(value));
    return h('div', { className: 'pk-one' },
      h('select', { id, className: 'lab-input', value: other ? OTHER : (value || ''), onChange: e => { const v = e.target.value; setOther(v === OTHER); onChange(v === OTHER ? '' : v); } },
        h('option', { value: '' }, placeholder), ...optionsOf(groups, options), h('option', { value: OTHER }, otherLabel)),
      other && h('input', { className: 'lab-input', value: value || '', onChange: e => onChange(e.target.value), maxLength, placeholder: 'Type it here', 'aria-label': 'Type your own', autoFocus: !value }));
  }

  /** Searchable multi-select with chips. value: string[]. */
  function PickMany({ id, value, onChange, groups, max = 20, placeholder = 'Search or add your own…' }) {
    const [q, setQ] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const boxRef = React.useRef(null);
    React.useEffect(() => {
      const close = e => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }, []);
    const has = v => value.some(x => x.toLowerCase() === v.toLowerCase());
    const add = v => { const t = v.trim(); if (!t || has(t) || value.length >= max) return; onChange([...value, t.slice(0, 60)]); setQ(''); };
    const needle = q.trim().toLowerCase();
    const shown = groups.map(([label, list]) => [label, list.filter(x => !has(x) && (!needle || x.toLowerCase().includes(needle)))]).filter(([, l]) => l.length);
    const exact = groups.some(([, l]) => l.some(x => x.toLowerCase() === needle));
    return h('div', { className: 'pk-many', ref: boxRef },
      value.length > 0 && h('div', { className: 'pk-chips' }, ...value.map(v => h('span', { key: v, className: 'pk-chip' }, v,
        h('button', { type: 'button', onClick: () => onChange(value.filter(x => x !== v)), 'aria-label': 'Remove ' + v }, '×')))),
      value.length < max
        ? h('input', { id, className: 'lab-input', value: q, placeholder, autoComplete: 'off', role: 'combobox', 'aria-expanded': open, 'aria-controls': id + '-list',
            onFocus: () => setOpen(true), onChange: e => { setQ(e.target.value); setOpen(true); },
            onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); add(shown[0]?.[1][0] || q); } else if (e.key === 'Escape') setOpen(false); } })
        : h('p', { className: 'lab-tiny' }, `Maximum ${max} reached.`),
      open && value.length < max && h('div', { id: id + '-list', className: 'pk-list', role: 'listbox' },
        needle && !exact && h('button', { type: 'button', className: 'pk-add', onClick: () => add(q) }, `+ Add “${q.trim()}”`),
        ...shown.map(([label, list]) => h('div', { key: label, className: 'pk-group' }, h('p', null, label),
          h('div', null, ...list.map(x => h('button', { key: x, type: 'button', role: 'option', 'aria-selected': false, onClick: () => add(x) }, x))))),
        h('button', { type: 'button', className: 'pk-done', onClick: () => setOpen(false) }, 'Done')));
  }

  /** Language + level rows. value: [{ name, level }] */
  function LanguagePicker({ id, value, onChange }) {
    const rows = value.length ? value : [{ name: '', level: '' }];
    const setRow = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    const taken = rows.map(r => r.name);
    return h('div', { className: 'pk-langs' },
      ...rows.map((r, i) => h('div', { key: i, className: 'pk-lang' },
        h(PickOne, { id: `${id}-${i}`, value: r.name, onChange: v => setRow(i, { name: v }), options: LANGUAGES.filter(l => l === r.name || !taken.includes(l)), placeholder: 'Language…', maxLength: 40 }),
        h('select', { className: 'lab-input', value: r.level, onChange: e => setRow(i, { level: e.target.value }), 'aria-label': 'Level' }, h('option', { value: '' }, 'Level…'), ...LEVELS.map(opt)),
        h('button', { type: 'button', className: 'pk-x', onClick: () => onChange(rows.filter((_, j) => j !== i)), 'aria-label': 'Remove language' }, '×'))),
      rows.length < 8 && h('button', { type: 'button', className: 'ma-linkbtn', onClick: () => onChange([...rows, { name: '', level: '' }]) }, '+ Add another language'));
  }

  return { PickOne, PickMany, LanguagePicker };
}
