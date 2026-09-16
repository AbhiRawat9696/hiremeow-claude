import {createPlatform} from './platform/index.js';
import {createAgent} from './platform/agent.js';
import {createMeowLab} from './meow-lab.js';
import {createProfileDashboard} from './profile-dashboard.js';
const CAT_ORANGE='#f4a24c',CAT_DARK='#d9772b',CAT_CREAM='#fff1dc',CAT_INK='#1d2a5c';
function catParts(h){return{
 face:()=>[
  h('path',{key:'el',d:'M62 88 70 30 112 62Z',fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4,strokeLinejoin:'round'}),
  h('path',{key:'er',d:'M258 88 250 30 208 62Z',fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4,strokeLinejoin:'round'}),
  h('path',{key:'eli',d:'M76 76 80 48 100 64Z',fill:'#f7a8a0'}),
  h('path',{key:'eri',d:'M244 76 240 48 220 64Z',fill:'#f7a8a0'}),
  h('ellipse',{key:'hd',cx:160,cy:122,rx:104,ry:82,fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4}),
  h('path',{key:'st',d:'M148 46v18M160 42v22M172 46v18',stroke:CAT_DARK,strokeWidth:6,strokeLinecap:'round'}),
  h('ellipse',{key:'mz',cx:160,cy:150,rx:46,ry:34,fill:CAT_CREAM}),
  h('g',{key:'eyes',className:'cat-eyes'},
   h('circle',{cx:118,cy:120,r:20,fill:CAT_INK}),h('circle',{cx:202,cy:120,r:20,fill:CAT_INK}),
   h('circle',{cx:124,cy:113,r:7,fill:'#fff'}),h('circle',{cx:208,cy:113,r:7,fill:'#fff'}),
   h('circle',{cx:113,cy:127,r:3,fill:'#fff'}),h('circle',{cx:197,cy:127,r:3,fill:'#fff'})),
  h('ellipse',{key:'ckl',cx:92,cy:150,rx:15,ry:9,fill:'#f78f8f',opacity:.55}),
  h('ellipse',{key:'ckr',cx:228,cy:150,rx:15,ry:9,fill:'#f78f8f',opacity:.55}),
  h('path',{key:'ns',d:'M152 138h16l-8 9z',fill:'#e8606a',stroke:CAT_INK,strokeWidth:2,strokeLinejoin:'round'}),
  h('path',{key:'mo',d:'M160 147v6m0 0c-4 8-14 8-17 1m17-1c4 8 14 8 17 1',fill:'none',stroke:CAT_INK,strokeWidth:3,strokeLinecap:'round'}),
  h('path',{key:'wh',d:'M40 132l34 6M38 150l36-2M280 132l-34 6M282 150l-36-2',stroke:CAT_INK,strokeWidth:2.5,strokeLinecap:'round',opacity:.7})
 ]};}
function CatFace(){
 const h=CatFace.React.createElement;
 return h('svg',{viewBox:'30 25 260 190',width:44,height:34},...catParts(h).face());
}
function CatScene(){
 const h=CatScene.React.createElement;
 const cap=(x,y,s,k)=>h('g',{key:k,transform:`translate(${x} ${y}) scale(${s})`},h('path',{d:'M0 10 30 0 60 10 30 20Z',fill:CAT_INK}),h('path',{d:'M14 15v10c8 5 24 5 32 0V15L30 20Z',fill:'#2b3b78'}),h('path',{d:'M30 10 50 14v14',stroke:'#f5b700',strokeWidth:2.5,fill:'none'}));
 const spark=(x,y,s,c,k)=>h('path',{key:k,className:'cat-spark',style:{animationDelay:(k*0.4)+'s'},transform:`translate(${x} ${y}) scale(${s})`,d:'M0-10C1-3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10Z',fill:c});
 return h('svg',{className:'cat-scene',viewBox:'0 0 480 440',role:'img','aria-label':'A cheerful cartoon cat graduate in a mortarboard, holding a diploma, with a Thai flag badge.'},
  h('g',{className:'cat-dots',fill:'#9db5e8'},...Array.from({length:16},(_,i)=>h('circle',{key:i,cx:370+(i%4)*16,cy:300+Math.floor(i/4)*16,r:3}))),
  h('g',{className:'cat-float-a'},cap(30,90,1.1,'c1')),
  h('g',{className:'cat-float-b'},cap(40,300,.9,'c2')),
  h('g',{className:'cat-plane'},h('path',{d:'M410 150l40-16-6 8-18 10 8 18-6 3-12-15-16 7 2 8-4 2-5-12-12-5 2-4 8 2 7-16-15-12 3-6 18 8z',fill:'#2c4fb8'})),
  h('g',{className:'cat-float-b'},h('rect',{x:392,y:40,width:52,height:64,rx:6,fill:'#fff',stroke:'#c9d6f2',strokeWidth:2,transform:'rotate(14 418 72)'}),h('path',{d:'M404 58h26M402 70h28M400 82h20',stroke:'#f0a04b',strokeWidth:3,strokeLinecap:'round',transform:'rotate(14 418 72)'})),
  spark(110,60,1.2,'#f4a24c',1),spark(430,230,1,'#f4a24c',2),spark(90,220,.8,'#ffffff',3),spark(350,40,.9,'#ffffff',4),
  h('ellipse',{cx:240,cy:420,rx:120,ry:14,fill:'#1d2a5c',opacity:.12,className:'cat-shadow'}),
  h('g',{className:'cat-bob'},
   h('g',{className:'cat-tail'},h('path',{d:'M300 370c50-6 70-40 58-78-6-18 10-26 20-12 22 36-2 110-72 108',fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4,strokeLinejoin:'round'}),h('path',{d:'M352 300c8-4 14-2 18 4',stroke:CAT_DARK,strokeWidth:6,strokeLinecap:'round',fill:'none'})),
   h('path',{d:'M150 300c-20 30-24 80-6 106h192c18-26 14-76-6-106z',fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4,strokeLinejoin:'round'}),
   h('ellipse',{cx:240,cy:360,rx:48,ry:42,fill:CAT_CREAM}),
   h('ellipse',{cx:182,cy:404,rx:30,ry:16,fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4}),
   h('ellipse',{cx:298,cy:404,rx:30,ry:16,fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4}),
   h('path',{d:'M176 296c30 22 98 22 128 0l-6 18c-34 18-82 18-116 0z',fill:'#2b3b78'}),
   h('g',{transform:'translate(222 312)'},h('rect',{width:36,height:24,rx:3,fill:'#fff',stroke:CAT_INK,strokeWidth:2}),h('rect',{x:2,y:2,width:32,height:4,fill:'#e0303b'}),h('rect',{x:2,y:9,width:32,height:6,fill:'#2d2a7a'}),h('rect',{x:2,y:18,width:32,height:4,fill:'#e0303b'})),
   h('g',{className:'cat-scroll'},h('rect',{x:120,y:318,width:90,height:28,rx:14,fill:'#fffaf0',stroke:CAT_INK,strokeWidth:3,transform:'rotate(-32 165 332)'}),h('path',{d:'M158 318l12 26',stroke:'#e0303b',strokeWidth:6,transform:'rotate(-32 165 332)'}),h('circle',{cx:176,cy:344,r:16,fill:CAT_ORANGE,stroke:CAT_INK,strokeWidth:4})),
   h('g',{className:'cat-head',transform:'translate(80 92)'},
    ...catParts(h).face(),
    h('g',{transform:'translate(78 -34)'},
     h('path',{d:'M8 58c20 12 116 12 144 0l-4 28c-30 12-106 12-136 0z',fill:'#2b3b78',stroke:CAT_INK,strokeWidth:3}),
     h('path',{d:'M-10 36 80 6l90 30-90 30z',fill:CAT_INK}),
     h('circle',{cx:80,cy:36,r:6,fill:'#f5b700'}),
     h('g',{className:'cat-tassel'},h('path',{d:'M80 36 150 50v34',stroke:'#f5b700',strokeWidth:4,fill:'none',strokeLinecap:'round'}),h('path',{d:'M144 82h12l-2 18h-8z',fill:'#f5b700'}))
    )
   )
  )
 );
}
export function createHireMeowApp(React, components) {
 CatFace.React=React;CatScene.React=React;
 const ProfileDashboard=createProfileDashboard(React);
 const MeowLab=createMeowLab(React);
 const P=createPlatform(React);
 const {MeowAgent}=createAgent(React);
 const h=React.createElement;
 const {VisaAdvisor,ResumeChecker,EmployerDirectory,UniversityDashboard,HRDashboard,LanguagePicker,translations}=components;
 return function HireMeowApp(){
  const [section,setSection]=React.useState('visa');
  const [view,setView]=React.useState('student');
  const [language,setLanguage]=React.useState('EN');
  const [authRole,setAuthRole]=React.useState(null);
  const platform=P.usePlatform();
  const openAuth=role=>setAuthRole(typeof role==='string'?role:'student');
  React.useEffect(()=>{if(platform.profile)P.applyPendingRole(platform.profile).then(changed=>{if(changed)location.reload();});},[platform.profile?.id]);
  React.useEffect(()=>{const q=new URLSearchParams(location.search);if(q.get('pool'))setView('pool');},[]);
  const copy=translations[language];
  const open=React.useCallback((next,scroll=true)=>{
   if(next==='hr')setView('companies');
   else if(['university','profile','lab','jobs','companies','pool','admin'].includes(next))setView(next);
   else if(['visa','resume','employers'].includes(next)){setView('student');setSection(next);}
   if(scroll)requestAnimationFrame(()=>document.getElementById('tool-section')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
  },[]);
  React.useEffect(()=>{const go=e=>open(e.detail);window.addEventListener('careerbridge:navigate',go);return()=>window.removeEventListener('careerbridge:navigate',go);},[open]);
  React.useEffect(()=>{
   if(!document.modelContext?.registerTool)return;
   const lifecycle=new AbortController();
   Promise.resolve(document.modelContext.registerTool({name:'open_career_tool',title:'Open a HireMeow tool',description:'Open career chat, resume feedback, employers, or a dashboard.',inputSchema:{type:'object',properties:{section:{type:'string',enum:['visa','resume','employers','university','hr','jobs','lab','profile']}},required:['section'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||Object.keys(input).length!==1||!['visa','resume','employers','university','hr','jobs','lab','profile'].includes(input.section))throw new Error('Choose a valid HireMeow section.');open(input.section);return{section:input.section,status:'opened'};}},{signal:lifecycle.signal})).catch(()=>{});
   return()=>lifecycle.abort();
  },[open]);
  const personas=[
   {emoji:'🎓',tone:'blue',title:'Myanmar Business Student',text:'Final year, no job yet. Needs ED Plus 1-year extension + list of BOI companies that sponsor Non-B.',tool:'visa'},
   {emoji:'💻',tone:'green',title:'Chinese IT Student',text:'Has offer from tech startup. Needs to check if company can sponsor Non-B and what docs HR needs.',tool:'employers'},
   {emoji:'🔧',tone:'orange',title:'Indian Engineering Student',text:'Looking for manufacturing in EEC. Needs SMART Visa info for S-curve industries.',tool:'visa'}
  ];
  const ICONS={
   blue:['M22 10 12 5 2 10l10 5 10-5Z','M6 12v5c3 2 9 2 12 0v-5'],
   green:['M6 6h12v12H6z','M9 9h6v6H9z','M9 2v4','M15 2v4','M9 18v4','M15 18v4','M2 9h4','M2 15h4','M18 9h4','M18 15h4'],
   orange:['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z']
  };
  const [query,setQuery]=React.useState('');
  const searchEmployers=q=>{
   open('employers');
   let tries=0;
   const fill=()=>{const input=document.querySelector('#career-panel input[placeholder^="Search by company"]');if(!input){if(++tries<20)setTimeout(fill,100);return;}Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,q.trim());input.dispatchEvent(new Event('input',{bubbles:true}));};
   setTimeout(fill,50);
  };
  const features=[
   {id:'visa',tone:'blue',title:'Visa Guide',text:'Ask about student, work and long-stay visas, with step-by-step guidance in plain language.',chips:['Student visa','Work permit','ED Plus'],icon:['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z','M14 3v5h5','M9 13h6','M9 17h6','M9 9h1']},
   {id:'resume',tone:'orange',title:'Resume Feedback',text:'Check your resume against what Thai employers usually expect before you apply.',chips:['Thai format','Photo & details','Review'],icon:['M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2','M9 12h7','M9 16h5','m14 7 1.5 1.5L18 6']},
   {id:'employers',tone:'teal',title:'Employer Directory',text:'Explore BOI-registered companies in Thailand by industry and location.',chips:['Tech','Business','Manufacturing'],icon:['M4 8h16v11H4z','M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2','M4 13h16','M11 13v2h2v-2']}
  ];
  const tabs=[['visa','01','Ask HireMeow','Visas & career questions'],['resume','02',copy.features.resumeTitle,'Get your application ready'],['employers','03',copy.nav.employers,'Explore companies in Thailand']];
  return h('div',{className:'hiremeow'},
   h('a',{href:'#tool-section',className:'hm-skip'},'Skip to career tools'),
   h('header',{className:'hm-header'},h('div',{className:'hm-header-inner'},
    h('button',{className:'hm-brand',onClick:()=>{setView('student');window.scrollTo({top:0,behavior:'smooth'});},'aria-label':'HireMeow home'},h('span',{className:'hm-brand-icon','aria-hidden':true},h(CatFace)),h('span',null,'Hire',h('b',null,'Meow'),h('small',null,'YOUR THAILAND CAREER COMPANION'))),
    h('nav',{'aria-label':'Main navigation',className:'hm-nav'},...[["student","For graduates"],["jobs","Jobs"],["lab","Meow Lab"],["companies","Companies"],["university","Universities"],["profile","My profile"]].map(([id,label])=>h('button',{key:id,'aria-current':view===id?'page':undefined,onClick:()=>{setView(id);window.scrollTo({top:0});}},label))),
    h('div',{className:'hm-header-tools'},h(LanguagePicker,{current:language,onChange:setLanguage}),h(P.AccountButton,{platform,onOpenAuth:()=>openAuth('student'),onNavigate:v=>{setView(v);window.scrollTo({top:0});}}))
   )),
   view==='student'&&h(React.Fragment,null,
    h('section',{className:'hm-hero-band'},h('div',{className:'hm-hero'},
     h('div',{className:'hm-hero-copy'},
      h('p',{className:'hm-eyebrow'},h('span',{'aria-hidden':true},'🇹🇭'),'FOR INTERNATIONAL STUDENTS & GRADUATES'),
      h('h1',null,'Your Thai career ',h('em',null,'starts here.')),
      h('p',{className:'hm-intro'},'Visa guidance, resume feedback, and employers in Thailand, in one friendly place. Safe, simple, and supported.'),
      h('form',{className:'hm-search',role:'search',onSubmit:e=>{e.preventDefault();searchEmployers(query);}},
       h('label',{htmlFor:'hm-employer-search',className:'hm-visually-hidden'},'Search employers by company name'),
       h('svg',{viewBox:'0 0 24 24',width:20,height:20,'aria-hidden':true,fill:'none',stroke:'currentColor',strokeWidth:2.2,strokeLinecap:'round'},h('circle',{cx:11,cy:11,r:7}),h('path',{d:'m20 20-3.5-3.5'})),
       h('input',{id:'hm-employer-search',type:'search',value:query,onChange:e=>setQuery(e.target.value),placeholder:'Search employers, e.g. Bangkok Bank',autoComplete:'off'}),
       h('button',{type:'submit'},'Search employers')),
      h('ul',{className:'hm-trust'},...['Visa pathway guidance','Work permit steps','Thai resume tips'].map(t=>h('li',{key:t},t))),
      h('div',{className:'hm-hero-actions'},h('button',{className:'hm-primary',onClick:()=>open('visa')},'Ask HireMeow',h('span',{'aria-hidden':true},' →')))
     ),
     h('div',{className:'hm-hero-art'},h(CatScene))
    )),
    h('section',{className:'hm-features','aria-labelledby':'features-title'},
     h('h2',{id:'features-title'},'Everything you need to succeed'),
     h('div',{className:'hm-feature-grid'},...features.map(f=>h('article',{key:f.id,className:'hm-feature hm-feature-'+f.tone},
      h('span',{className:'hm-feature-icon','aria-hidden':true},h('svg',{viewBox:'0 0 24 24',width:26,height:26,fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round',strokeLinejoin:'round'},...f.icon.map((d,j)=>h('path',{key:j,d})))),
      h('h3',null,h('button',{type:'button',onClick:()=>open(f.id)},f.title)),
      h('p',null,f.text),
      h('div',{className:'hm-chips'},...f.chips.map(c=>h('button',{key:c,type:'button',onClick:()=>open(f.id)},c)))
     )))
    ),
    h('section',{className:'hm-lab-promo','aria-labelledby':'lab-promo-title'},
     h('div',null,h('p',{className:'hm-eyebrow'},'NEW · MEOW LAB'),h('h2',{id:'lab-promo-title'},'Is your resume purr-fect?'),h('p',null,'Get your MeowScore™, practise with a cat interviewer, and collect skill badges.')),
     h('div',{className:'hm-lab-promo-actions'},h('button',{className:'hm-primary',onClick:()=>{setView('lab');window.scrollTo({top:0});}},'Roast my resume 🔥'),h('span',null,'🎙️ Mock interview · 🏅 Skill Quests · 💘 MeowMatch'))
    ),
    h('main',{id:'tool-section',className:'hm-workspace'},
     h('div',{className:'hm-workspace-heading'},h('div',null,h('p',{className:'hm-eyebrow'},'A GOOD PLACE TO START'),h('h2',null,'Make your next move.')),h('span',{className:'hm-thailand'},'Made for international talent in Thailand')),
     h('div',{className:'hm-tool-tabs',role:'tablist','aria-label':'Career tools'},...tabs.map(([id,number,title,description])=>h('button',{key:id,id:'tab-'+id,role:'tab','aria-selected':section===id,'aria-controls':'career-panel',tabIndex:section===id?0:-1,className:section===id?'active':'',onClick:()=>setSection(id),onKeyDown:e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const index=tabs.findIndex(t=>t[0]===id);const next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3;setSection(tabs[next][0]);requestAnimationFrame(()=>document.getElementById('tab-'+tabs[next][0])?.focus());}}},h('span',{className:'hm-tab-number'},number),h('span',null,h('strong',null,title),h('small',null,description)),h('span',{className:'hm-tab-arrow','aria-hidden':true},'↗')))),
     h('div',{id:'career-panel',role:'tabpanel','aria-labelledby':'tab-'+section,className:'hm-tool-panel'},section==='visa'?h(VisaAdvisor):section==='resume'?h(ResumeChecker):h(EmployerDirectory))
    ),
    h('section',{className:'hm-personas','aria-labelledby':'personas-title'},
     h('div',{className:'hm-personas-heading'},h('h2',{id:'personas-title'},'Who Is This For?'),h('p',null,'Target User Personas')),
     h('div',{className:'hm-persona-grid'},...personas.map((p,i)=>h('article',{key:p.title,className:'hm-persona hm-persona-'+p.tone,style:{animationDelay:(i*100)+'ms'}},
      h('div',{className:'hm-persona-top'},h('span',{className:'hm-persona-icon','aria-hidden':true},h('svg',{viewBox:'0 0 24 24',width:22,height:22,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},...ICONS[p.tone].map((d,j)=>h('path',{key:j,d})))),h('span',{className:'hm-persona-emoji','aria-hidden':true},p.emoji)),
      h('h3',null,p.title),
      h('p',null,p.text)
     )))
    )
   ),
   view==='lab'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'MEOW LAB · NEW'),h('h1',null,'Get hired, the fun way.'),h('p',{className:'hm-lab-sub'},'Roast your resume, practise interviews, earn badges and find the workplace that fits you.')),h(MeowLab)),
   view==='profile'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'MY HIREMEOW'),h('h1',null,'Your career dashboard.')),platform.live&&!platform.user&&h(P.SignInPrompt,{onOpenAuth:openAuth}),platform.live&&platform.profile?.role==='student'&&h(P.StudentHub,{platform,onNavigate:open}),platform.live&&platform.profile&&platform.profile.role!=='student'&&h(P.ui.Notice,{tone:'info'},platform.profile.role==='company'?'You are signed in as a company. Your tools are in the Companies tab.':'You are signed in as an admin.'),platform.live&&platform.profile?.role==='student'&&h('h2',{className:'pf-section-title'},'Checklist & private notes (this device only)'),h(ProfileDashboard,{onOpen:open,notesOnly:platform.live&&platform.profile?.role==='student'})),
   view==='jobs'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'JOBS IN THAILAND'),h('h1',null,'Find a job with the salary up front.'),h('p',{className:'hm-lab-sub'},'Filter by BTS/MRT stop, distance and pay. Every listing shows a real salary range.')),platform.ready?(platform.live?h(P.JobsBoard,{platform,onOpenAuth:openAuth}):h(P.ui.SetupNeeded,{what:'the Jobs board'})):h('p',null,'Loading…')),
   view==='companies'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'FOR COMPANIES'),h('h1',null,platform.profile?.role==='company'?'Your hiring dashboard.':'Find your next great teammate.')),!platform.ready?h('p',null,'Loading…'):!platform.live?h(React.Fragment,null,h(P.ui.Notice,{tone:'warn'},'Demo dashboard: connect Supabase to turn on real company accounts, job posting and Reverse Hiring.'),h(HRDashboard)):platform.profile?.role==='company'?h(P.CompanyDashboard,{platform,onNavigate:open}):h(P.CompaniesLanding,{platform,onOpenAuth:openAuth,onNavigate:open})),
   view==='pool'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'MEOW POOL'),h('h1',null,'Top 50 talent, every month.')),!platform.ready?h('p',null,'Loading…'):platform.live?h(P.MeowPool,{platform,onOpenAuth:openAuth,onNavigate:open}):h(P.ui.SetupNeeded,{what:'the Meow Pool'})),
   view==='admin'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'ADMIN'),h('h1',null,'Run HireMeow.')),platform.live?h(P.AdminPanel,{platform}):h(P.ui.SetupNeeded,{what:'the admin panel'})),
   
   view==='university'&&h('main',{id:'tool-section',className:'hm-dashboard'},h('div',{className:'hm-dashboard-heading'},h('p',{className:'hm-eyebrow'},'HIREMEOW PARTNERS'),h('h1',null,'Help talent take the next step.')),h(UniversityDashboard)),
   h('footer',{className:'hm-footer'},h('div',null,h('strong',null,'🐾 HireMeow'),h('span',null,'A little guidance. A world of possibility.')),h('p',null,'General career and visa guidance. Confirm current requirements with the relevant Thai authority. Employer directory and partner dashboard records are demonstration data; sponsorship is not guaranteed.'),h('nav',{className:'hm-footer-links','aria-label':'Footer'},...[['jobs','Jobs'],['lab','Meow Lab'],['companies','For companies'],['pool','Meow Pool']].map(([id,l])=>h('button',{key:id,type:'button',onClick:()=>{setView(id);window.scrollTo({top:0});}},l)))),
   h(MeowAgent,{platform,onOpenAuth:openAuth,onNavigate:v=>{open(v,false);window.scrollTo({top:0});}}),
   authRole&&h(P.AuthDialog,{initialRole:authRole,onClose:()=>setAuthRole(null)})
  );
 };
}
