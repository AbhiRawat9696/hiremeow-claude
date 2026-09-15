// Demo previews of HireMeow marketplace ideas. All companies, people and numbers are fictional.
const COMPANIES=[
 {id:'siampixel',name:'Siam Pixel Studio',field:'Design & games',station:'Ari',size:'40 people',reply:92,days:2,convert:68,health:'good',news:'Closed a seed round last month (demo headline).'},
 {id:'lotus',name:'Lotus Fintech',field:'Fintech',station:'Asok',size:'120 people',reply:78,days:4,convert:55,health:'good',news:'Launched a new payments app (demo headline).'},
 {id:'chaophraya',name:'Chao Phraya Logistics',field:'Logistics',station:'On Nut',size:'800 people',reply:41,days:9,convert:30,health:'warn',news:'Hiring freeze in two departments (demo headline).'},
 {id:'nimman',name:'Nimman Labs',field:'AI startup',station:'Phrom Phong',size:'25 people',reply:88,days:3,convert:72,health:'good',news:'Doubled its engineering team (demo headline).'},
 {id:'krungthep',name:'Krungthep Coffee Co.',field:'Food & retail',station:'Siam',size:'300 people',reply:64,days:5,convert:44,health:'bad',news:'Announced store closures and layoffs (demo headline).'},
 {id:'andaman',name:'Andaman Green Energy',field:'Clean energy',station:'Phaya Thai',size:'210 people',reply:83,days:3,convert:61,health:'good',news:'Won a solar contract in the EEC (demo headline).'}
];
const byId=Object.fromEntries(COMPANIES.map(c=>[c.id,c]));
const OFFERS=[
 {id:'o1',co:'siampixel',role:'Junior UX Designer',min:28000,max:35000,msg:'Your MeowScore and Gold “50-Word Pitch” badge caught our eye.'},
 {id:'o2',co:'nimman',role:'Data Analyst Intern',min:15000,max:18000,msg:'We liked your MeowMatch DNA: Adventure Cat. Want to chat?'},
 {id:'o3',co:'andaman',role:'Graduate Trainee, Operations',min:25000,max:30000,msg:'We’re hiring English-first graduates for our EEC site.'}
];
const LISTINGS=[
 {co:'lotus',role:'Marketing Associate',min:30000,max:38000,type:'Full-time'},
 {co:'chaophraya',role:'Supply Chain Intern',min:null,max:null,type:'Internship'},
 {co:'siampixel',role:'2D Game Artist',min:32000,max:42000,type:'Full-time'},
 {co:'krungthep',role:'Brand Executive',min:null,max:null,type:'Full-time'},
 {co:'nimman',role:'ML Engineer (Graduate)',min:45000,max:60000,type:'Full-time'},
 {co:'andaman',role:'Sustainability Intern',min:12000,max:15000,type:'Internship'}
];
// BTS Sukhumvit Line, Mo Chit to On Nut (in order)
const SUKHUMVIT=['Mo Chit','Saphan Khwai','Ari','Sanam Pao','Victory Monument','Phaya Thai','Ratchathewi','Siam','Chit Lom','Phloen Chit','Nana','Asok','Phrom Phong','Thong Lo','Ekkamai','Phra Khanong','On Nut'];
const POOL=[
 {n:'Aye M.',from:'Myanmar',study:'Business, Chula',score:91,badges:['🥇','🥈','🥇'],dna:'Office Lion'},
 {n:'Li W.',from:'China',study:'Computer Science, KMUTT',score:88,badges:['🥇','🥇'],dna:'Adventure Cat'},
 {n:'Priya S.',from:'India',study:'Mechanical Eng., AIT',score:86,badges:['🥈','🥇','🥉'],dna:'Steady Tabby'},
 {n:'Nguyen T.',from:'Vietnam',study:'Marketing, Mahidol Intl',score:84,badges:['🥇'],dna:'Laptop Nomad'},
 {n:'Sofia R.',from:'Spain',study:'Hospitality, Stamford',score:83,badges:['🥈','🥈'],dna:'Mission Kitten'},
 {n:'Kenji O.',from:'Japan',study:'Economics, Thammasat',score:82,badges:['🥇','🥉'],dna:'Office Lion'}
];
const baht=n=>'฿'+n.toLocaleString('en-US');

export function createMeowDemos(React){
 const h=React.createElement;
 const Tag=()=>h('span',{className:'demo-tag'},'DEMO');
 const Section=({id,num,title,pitch,children})=>h('section',{className:'demo-sec','aria-labelledby':'demo-'+id},
  h('div',{className:'demo-sec-head'},h('span',{className:'demo-num'},num),h('div',null,h('h3',{id:'demo-'+id},title,' ',h(Tag)),h('p',null,pitch))),children);
 const Paw=({state})=>h('span',{className:'demo-paw demo-paw-'+state,title:state==='good'?'Healthy':state==='warn'?'Watch':'Risk'},'🐾');

 function ReverseHiring(){
  const [open,setOpen]=React.useState(false);
  const [resp,setResp]=React.useState({});
  return h(Section,{id:'reverse',num:'02',title:'Reverse Hiring',pitch:'Companies send “We want to hire you” with salary upfront. Students just switch on Open to offers.'},
   h('div',{className:'demo-card'},
    h('label',{className:'demo-toggle',htmlFor:'demo-open'},h('input',{type:'checkbox',role:'switch',id:'demo-open',checked:open,onChange:e=>setOpen(e.target.checked)}),h('span',{className:'demo-switch','aria-hidden':true}),h('strong',null,open?'Open to offers':'Not looking right now')),
    open?h('ul',{className:'demo-offers'},...OFFERS.map(o=>{const c=byId[o.co];return h('li',{key:o.id,className:'demo-offer'},
     h('p',{className:'demo-offer-kicker'},c.name+' wants to hire you'),
     h('strong',null,o.role),h('p',{className:'demo-salary'},baht(o.min)+' – '+baht(o.max)+' / month'),h('p',{className:'demo-muted'},'“'+o.msg+'”'),
     resp[o.id]?h('p',{className:'demo-resp'},resp[o.id]==='yes'?'✅ You said you’re interested. (Demo: nothing was sent.)':'👋 Declined politely. (Demo)')
     :h('div',{className:'demo-row'},h('button',{type:'button',className:'lab-btn',onClick:()=>setResp({...resp,[o.id]:'yes'})},'I’m interested'),h('button',{type:'button',className:'lab-btn-ghost',onClick:()=>setResp({...resp,[o.id]:'no'})},'No thanks')));}))
    :h('p',{className:'demo-muted'},'Switch on to preview the offers that would arrive in your inbox.')
   ));
 }

 function MeowPitch(){
  const [state,setState]=React.useState('idle');
  const [left,setLeft]=React.useState(60);
  const [url,setUrl]=React.useState('');
  const [err,setErr]=React.useState('');
  const rec=React.useRef(null),stream=React.useRef(null),live=React.useRef(null);
  React.useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop());if(url)URL.revokeObjectURL(url);},[]);
  React.useEffect(()=>{if(state!=='rec')return;if(left<=0){stop();return;}const t=setTimeout(()=>setLeft(l=>l-1),1000);return()=>clearTimeout(t);},[state,left]);
  const startRec=async()=>{
   setErr('');
   try{
    const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',aspectRatio:9/16},audio:true});
    stream.current=s;if(live.current)live.current.srcObject=s;
    const chunks=[];const r=new MediaRecorder(s);rec.current=r;
    r.ondataavailable=e=>chunks.push(e.data);
    r.onstop=()=>{s.getTracks().forEach(t=>t.stop());const b=new Blob(chunks,{type:r.mimeType});setUrl(URL.createObjectURL(b));setState('done');};
    r.start();setLeft(60);setState('rec');
   }catch{setErr('Your camera isn’t available in this view, so the demo shows the flow without recording.');setState('mock');}
  };
  const stop=()=>{if(rec.current&&rec.current.state!=='inactive')rec.current.stop();else setState('done');};
  return h(Section,{id:'pitch',num:'03',title:'1-Minute Meow Pitch',pitch:'No cover letter. A 60-second vertical video answering one question. Founders watch 10× faster.'},
   h('div',{className:'demo-card demo-pitch'},
    h('div',{className:'demo-phone'},
     state==='done'&&url?h('video',{src:url,controls:true,playsInline:true}):h('video',{ref:live,autoPlay:true,muted:true,playsInline:true,hidden:state!=='rec'}),
     state!=='rec'&&!(state==='done'&&url)&&h('div',{className:'demo-phone-q'},h('span',null,'Question from Siam Pixel Studio'),h('strong',null,'“Show us something you made and why you’re proud of it.”')),
     state==='rec'&&h('span',{className:'demo-rec'},'● '+left+'s')
    ),
    h('div',null,
     h('p',null,'Recordings stay on your device in this demo. Nothing is uploaded.'),
     err&&h('p',{className:'lab-warn'},err),
     h('div',{className:'demo-row'},
      state==='rec'?h('button',{type:'button',className:'lab-btn',onClick:stop},'Stop'):h('button',{type:'button',className:'lab-btn',onClick:startRec},state==='done'?'Record again':'Try recording 🎬'),
      state==='mock'&&h('span',{className:'demo-muted'},'Flow: record → preview → send to employer')
     )
    )
   ));
 }

 function SalaryWall(){
  const [only,setOnly]=React.useState(false);
  const rows=LISTINGS.filter(l=>!only||l.min);
  return h(Section,{id:'salary',num:'06',title:'Salary Transparency Wall',pitch:'Every offer shows a real salary range. Hide it, and Meow labels you “Hiding Treats 🐟”.'},
   h('div',{className:'demo-card'},
    h('label',{className:'demo-check',htmlFor:'demo-only'},h('input',{type:'checkbox',id:'demo-only',checked:only,onChange:e=>setOnly(e.target.checked)}),'Only show jobs with salaries'),
    h('div',{className:'demo-table-wrap'},h('table',{className:'demo-table'},
     h('thead',null,h('tr',null,h('th',null,'Role'),h('th',null,'Company'),h('th',null,'Type'),h('th',null,'Monthly salary'))),
     h('tbody',null,...rows.map((l,i)=>h('tr',{key:i},h('td',null,l.role),h('td',null,byId[l.co].name),h('td',null,l.type),h('td',null,l.min?h('span',{className:'demo-salary'},baht(l.min)+' – '+baht(l.max)):h('span',{className:'demo-hiding'},'Hiding Treats 🐟'))))))
    )
   ));
 }

 function Ghosting(){
  return h(Section,{id:'ghost',num:'07',title:'Ghosting Protection',pitch:'No reply in 5 days? Meow nudges the company, and every profile shows its real response rate.'},
   h('div',{className:'demo-card'},
    h('ol',{className:'demo-ghost-steps'},
     h('li',null,h('strong',null,'Day 0'),h('span',null,'You apply')),
     h('li',null,h('strong',null,'Day 5'),h('span',null,'No reply → Meow auto-nudges the recruiter')),
     h('li',null,h('strong',null,'Day 7'),h('span',null,'Still silent → response rate drops, you get a heads-up'))),
    h('div',{className:'demo-grid3'},...COMPANIES.slice(0,3).map(c=>h('div',{key:c.id,className:'demo-mini'},
     h('strong',null,c.name),
     h('p',{className:'demo-rate '+(c.reply>=75?'good':c.reply>=55?'warn':'bad')},'Replies '+c.reply+'% of the time'),
     h('span',{className:'lab-track'},h('span',{style:{width:c.reply+'%'}})),
     h('small',null,'Usually within '+c.days+' days'))))
   ));
 }

 function BangkokFirst(){
  const [home,setHome]=React.useState('Victory Monument');
  const [max,setMax]=React.useState(3);
  const hi=SUKHUMVIT.indexOf(home);
  const list=COMPANIES.map(c=>({...c,stops:Math.abs(SUKHUMVIT.indexOf(c.station)-hi)})).filter(c=>c.stops<=max).sort((a,b)=>a.stops-b.stops);
  return h(Section,{id:'bkk',num:'08',title:'Bangkok-First',pitch:'Filter by BTS stops from home, see internship-to-full-time conversion, and a First Job Guarantee for universities.'},
   h('div',{className:'demo-card'},
    h('div',{className:'demo-row demo-filters'},
     h('label',{htmlFor:'demo-home'},'My BTS station ',h('select',{id:'demo-home',className:'lab-input',value:home,onChange:e=>setHome(e.target.value)},...SUKHUMVIT.map(s=>h('option',{key:s,value:s},s)))),
     h('label',{htmlFor:'demo-max'},'Within ',h('select',{id:'demo-max',className:'lab-input',value:max,onChange:e=>setMax(+e.target.value)},...[1,3,5,8,16].map(n=>h('option',{key:n,value:n},n+' stop'+(n===1?'':'s')))))
    ),
    list.length?h('ul',{className:'demo-bkk'},...list.map(c=>h('li',{key:c.id},
     h('div',null,h('strong',null,c.name),h('small',null,'🚆 '+c.station+' · '+(c.stops===0?'your station':c.stops+' stop'+(c.stops===1?'':'s')))),
     h('span',{className:'demo-convert'},c.convert+'% interns → full-time'))))
    :h('p',{className:'demo-muted'},'No demo companies that close. Try more stops.'),
    h('p',{className:'lab-tiny'},'Demo covers the BTS Sukhumvit Line from Mo Chit to On Nut.'),
    h('div',{className:'demo-guarantee'},h('strong',null,'🎓 First Job Guarantee (for universities)'),h('p',null,'Partner universities get a dedicated Meow coach for every graduating international student, with a placement target and monthly progress reports.'))
   ));
 }

 function MeowPool(){
  const [asCo,setAsCo]=React.useState(false);
  return h(Section,{id:'pool',num:'11',title:'Meow Pool — Top 50',pitch:'Each month, the top 50 students in Bangkok (with video and MeowScore). Companies pay ฿3,000 for early access.'},
   h('div',{className:'demo-card'},
    h('div',{className:'demo-row'},h('button',{type:'button',className:asCo?'lab-btn-ghost':'lab-btn',onClick:()=>setAsCo(false)},'Visitor view'),h('button',{type:'button',className:asCo?'lab-btn':'lab-btn-ghost',onClick:()=>setAsCo(true)},'Paid company view')),
    h('div',{className:'demo-pool'+(asCo?'':' locked')},...POOL.map((p,i)=>h('div',{key:i,className:'demo-student'},
     h('div',{className:'demo-video','aria-hidden':true},'▶'),
     h('strong',null,p.n),h('small',null,p.from+' · '+p.study),
     h('div',{className:'demo-row demo-between'},h('span',{className:'demo-score'},p.score),h('span',null,p.badges.join(''))),
     h('small',null,'🧬 '+p.dna)))),
    !asCo&&h('div',{className:'demo-lock'},h('strong',null,'🔒 October drop unlocks for companies in 3 days'),h('p',null,'฿3,000 per company · 50 students · first come, first served'),h('button',{type:'button',className:'lab-btn',disabled:true},'Get early access (demo)'))
   ));
 }

 function LayoffRadar(){
  return h(Section,{id:'radar',num:'12',title:'Layoff Radar',pitch:'News signals turn into a green, amber or red paw on each company profile, so first jobs feel safer.'},
   h('div',{className:'demo-card'},h('ul',{className:'demo-radar'},...COMPANIES.map(c=>h('li',{key:c.id},h(Paw,{state:c.health}),h('div',null,h('strong',null,c.name),h('small',null,c.news)),h('span',{className:'demo-health demo-health-'+c.health},c.health==='good'?'Healthy':c.health==='warn'?'Watch':'Risk')))))
  );
 }

 return function MeowDemos(){
  return h('div',{className:'demo'},
   window.hiremeowPlatform?.live&&h('div',{className:'demo-banner demo-live',role:'note'},h('strong',null,'These features are live on HireMeow. '),'Use the Jobs, Companies and My profile tabs for the real versions. The previews below use made-up data.'),
   !window.hiremeowPlatform?.live&&h('div',{className:'demo-banner',role:'note'},h('strong',null,'Demo previews. '),'These show how upcoming HireMeow features would work. Every company, student, salary, response rate and headline here is made up, and nothing you do is sent anywhere.'),
   h(ReverseHiring),h(MeowPitch),h(SalaryWall),h(Ghosting),h(BangkokFirst),h(MeowPool),h(LayoffRadar)
  );
 };
}
