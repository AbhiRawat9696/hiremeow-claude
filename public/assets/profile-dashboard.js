// "My profile": a private dashboard stored only in this viewer's browser (localStorage).
const KEY='hiremeow.profile.v1';
const VISAS=['','Non-ED (student)','ED Plus / graduate stay','Non-B (business/work)','SMART Visa','LTR Visa','Tourist / visa exempt','Other'];
const INDUSTRIES=['Tech','Business','Manufacturing','Hospitality','Education','Healthcare','Finance','Startup'];
const STAGES=['Saved','Applied','Viewed','Shortlisted','Interview','Offer'];
const LEGACY={Interested:'Saved','Not now':'Saved'};
const LAB_KEY='hiremeow.lab.v1';
function loadLab(){try{return JSON.parse(localStorage.getItem(LAB_KEY)||'{}')||{};}catch{return {};}}
const CHECKLIST=[
 ['passport','Passport valid for your planned stay'],
 ['degree','Degree certificate and transcript ready'],
 ['resume','Resume updated in Thai-employer format'],
 ['offer','Job offer from a Thai employer'],
 ['nonb','Non-B visa obtained or in progress'],
 ['permit','Work permit issued before starting work'],
 ['tm30','Address reporting (TM30) confirmed by host'],
 ['ninety','90-day report date noted']
];
const EMPTY={profile:{name:'',nationality:'',university:'',field:'',gradYear:'',visa:'',visaExpiry:'',goal:'',location:'',languages:'',industries:[]},shortlist:[],checklist:{},notes:'',updated:null};

function load(){
 try{const raw=localStorage.getItem(KEY);if(!raw)return {data:structuredClone(EMPTY),ok:true};const d=JSON.parse(raw);const shortlist=(d.shortlist||[]).map(x=>({...x,closed:x.closed||x.stage==='Not now',stage:LEGACY[x.stage]||x.stage||'Saved',history:x.history||{}}));return {data:{...structuredClone(EMPTY),...d,shortlist,profile:{...EMPTY.profile,...(d.profile||{})}},ok:true};}
 catch{return {data:structuredClone(EMPTY),ok:false};}
}
function save(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
function wipe(){try{localStorage.removeItem(KEY);}catch{}}
function daysUntil(date){if(!date)return null;const t=new Date(date+'T00:00:00');if(isNaN(t))return null;const now=new Date();now.setHours(0,0,0,0);return Math.round((t-now)/86400000);}

export function createProfileDashboard(React){
 const h=React.createElement;
 return function ProfileDashboard({onOpen,notesOnly=false}){
  const initial=React.useMemo(load,[]);
  const [data,setData]=React.useState(initial.data);
  const [storageOk,setStorageOk]=React.useState(initial.ok);
  const [status,setStatus]=React.useState('');
  const [editing,setEditing]=React.useState(!initial.data.profile.name);
  const [draft,setDraft]=React.useState(initial.data.profile);
  const [employers,setEmployers]=React.useState([]);
  const [pick,setPick]=React.useState('');
  const [confirmWipe,setConfirmWipe]=React.useState(false);
  const notesTimer=React.useRef(null);
  const dataRef=React.useRef(data);dataRef.current=data;
  const lab=React.useMemo(loadLab,[]);

  React.useEffect(()=>{let live=true;fetch('assets/employers.json').then(r=>r.json()).then(list=>{if(live)setEmployers(Array.isArray(list)?list:[]);}).catch(()=>{});return()=>{live=false;};},[]);

  const commit=(next,message='Saved on this device')=>{
   const stamped={...next,updated:new Date().toISOString()};
   setData(stamped);
   const ok=save(stamped);setStorageOk(ok);
   setStatus(ok?message:'This browser is blocking storage, so changes will be lost when you leave.');
  };
  React.useEffect(()=>{if(!status)return;const t=setTimeout(()=>setStatus(''),3000);return()=>clearTimeout(t);},[status]);

  const p=data.profile;
  const fields=['name','nationality','university','field','gradYear','visa','visaExpiry','goal','location','languages'];
  const filled=fields.filter(f=>String(p[f]||'').trim()).length+(p.industries.length?1:0);
  const completeness=Math.round(filled/(fields.length+1)*100);
  const days=daysUntil(p.visaExpiry);
  const visaState=days===null?'none':days<0?'critical':days<=30?'critical':days<=90?'warning':'good';
  const visaLabel=days===null?'Add your visa expiry':days<0?`Expired ${-days} day${days===-1?'':'s'} ago`:days===0?'Expires today':`${days} day${days===1?'':'s'} left`;
  const done=CHECKLIST.filter(([id])=>data.checklist[id]).length;
  const initials=(p.name||'You').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');

  const field=(id,label,props={})=>h('label',{className:'pd-field',htmlFor:'pd-'+id},h('span',null,label),
   props.options?h('select',{id:'pd-'+id,value:draft[id],onChange:e=>setDraft({...draft,[id]:e.target.value})},...props.options.map(o=>h('option',{key:o,value:o},o||'Choose…')))
   :h('input',{id:'pd-'+id,type:props.type||'text',value:draft[id],maxLength:120,placeholder:props.placeholder||'',onChange:e=>setDraft({...draft,[id]:e.target.value})}));

  const available=employers.filter(e=>!data.shortlist.some(s=>s.id===e.id));

  return h('div',{className:'pd'},
   h('div',{className:'pd-privacy',role:'note'},
    h('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('rect',{x:5,y:11,width:14,height:10,rx:2}),h('path',{d:'M8 11V8a4 4 0 0 1 8 0v3'})),
    h('p',null,h('strong',null,'Private to you. '),storageOk?'Everything here is saved only in this browser on this device. Nobody else can see it, including the HireMeow team. It won’t appear on your other devices.':'This browser is blocking storage, so your profile can’t be saved here. Try a regular (non-private) window.')
   ),
   status&&h('p',{className:'pd-toast',role:'status'},status),

   !notesOnly&&h('section',{className:'pd-summary','aria-label':'Your summary'},
    h('div',{className:'pd-card pd-person'},
     h('span',{className:'pd-avatar','aria-hidden':true},initials),
     h('div',null,h('h2',null,p.name||'Your profile'),h('p',null,[p.field,p.university].filter(Boolean).join(' · ')||'Add your study details'),p.goal&&h('p',{className:'pd-goal'},'Goal: '+p.goal)),
     !editing&&h('button',{type:'button',className:'pd-ghost',onClick:()=>{setDraft(p);setEditing(true);}},'Edit profile')
    ),
    h('div',{className:'pd-card pd-stat','data-state':visaState},h('span',{className:'pd-label'},'Visa'),h('strong',null,visaLabel),h('span',{className:'pd-sub'},p.visa||'Visa type not set'),p.visaExpiry&&h('span',{className:'pd-pill'},visaState==='good'?'On track':visaState==='warning'?'Plan your renewal':'Act now')),
    h('div',{className:'pd-card pd-stat'},h('span',{className:'pd-label'},'Profile'),h('strong',null,completeness+'% complete'),h('span',{className:'pd-meter','aria-hidden':true},h('span',{style:{width:completeness+'%'}})),h('span',{className:'pd-sub'},filled+' of '+(fields.length+1)+' details')),
    h('div',{className:'pd-card pd-stat'},h('span',{className:'pd-label'},'Work-ready checklist'),h('strong',null,done+' / '+CHECKLIST.length),h('span',{className:'pd-meter','aria-hidden':true},h('span',{style:{width:(done/CHECKLIST.length*100)+'%'}})),h('span',{className:'pd-sub'},data.shortlist.length+' employer'+(data.shortlist.length===1?'':'s')+' shortlisted'))
   ),

   !notesOnly&&editing&&h('section',{className:'pd-card pd-edit','aria-labelledby':'pd-edit-title'},
    h('h3',{id:'pd-edit-title'},'Your details'),
    h('form',{onSubmit:e=>{e.preventDefault();commit({...data,profile:{...draft,name:draft.name.trim()}},'Profile saved on this device');setEditing(false);}},
     h('div',{className:'pd-grid'},
      field('name','Full name',{placeholder:'e.g. Aung Min'}),
      field('nationality','Nationality',{placeholder:'e.g. Myanmar'}),
      field('university','University in Thailand',{placeholder:'e.g. Chulalongkorn University'}),
      field('field','Field of study',{placeholder:'e.g. Business Administration'}),
      field('gradYear','Graduation year',{type:'number',placeholder:'2026'}),
      field('languages','Languages',{placeholder:'e.g. English, Thai (basic)'}),
      field('visa','Current visa',{options:VISAS}),
      field('visaExpiry','Visa expiry date',{type:'date'}),
      field('location','Preferred work location',{placeholder:'e.g. Bangkok, EEC'}),
      field('goal','Career goal',{placeholder:'e.g. Marketing role at a BOI company'})
     ),
     h('fieldset',{className:'pd-industries'},h('legend',null,'Industries you’re interested in'),
      ...INDUSTRIES.map(i=>h('label',{key:i,className:draft.industries.includes(i)?'on':''},h('input',{type:'checkbox',id:'pd-ind-'+i,checked:draft.industries.includes(i),onChange:()=>setDraft({...draft,industries:draft.industries.includes(i)?draft.industries.filter(x=>x!==i):[...draft.industries,i]})}),i))),
     h('div',{className:'pd-actions'},h('button',{type:'submit',className:'pd-primary'},'Save profile'),data.profile.name&&h('button',{type:'button',className:'pd-ghost',onClick:()=>setEditing(false)},'Cancel'))
    )
   ),

   !notesOnly&&!editing&&p.industries.length>0&&h('div',{className:'pd-tags'},...p.industries.map(i=>h('span',{key:i},i))),

   h('div',{className:'pd-columns'+(notesOnly?' pd-notes-only':'')},
    !notesOnly&&h('section',{className:'pd-card','aria-labelledby':'pd-short-title'},
     h('div',{className:'pd-head'},h('h3',{id:'pd-short-title'},'My applications'),h('button',{type:'button',className:'pd-link',onClick:()=>onOpen('employers')},'Browse directory →')),
     h('form',{className:'pd-add',onSubmit:e=>{e.preventDefault();const emp=employers.find(x=>x.id===pick);if(!emp)return;commit({...data,shortlist:[...data.shortlist,{id:emp.id,name:emp.name,industry:emp.industry,location:emp.location,website:emp.website,stage:'Saved',closed:false,history:{Saved:new Date().toISOString().slice(0,10)},added:new Date().toISOString().slice(0,10)}]},'Added '+emp.name);setPick('');}},
      h('label',{htmlFor:'pd-pick',className:'hm-visually-hidden'},'Choose an employer to add'),
      h('select',{id:'pd-pick',value:pick,onChange:e=>setPick(e.target.value)},h('option',{value:''},employers.length?'Add an employer from the directory…':'Loading employers…'),...available.map(e=>h('option',{key:e.id,value:e.id},e.name+' · '+e.location))),
      h('button',{type:'submit',className:'pd-primary',disabled:!pick},'Add')),
     data.shortlist.length===0?h('p',{className:'pd-empty'},'No employers yet. Add companies you want to apply to and track where you are with each one.')
     :h('ul',{className:'pd-list'},...data.shortlist.map(s=>{
       const idx=STAGES.indexOf(s.stage);
       const setStage=st=>{const today=new Date().toISOString().slice(0,10);commit({...data,shortlist:data.shortlist.map(x=>x.id===s.id?{...x,stage:st,history:{...x.history,[st]:x.history?.[st]||today}}:x)},s.name+': '+st);};
       return h('li',{key:s.id,className:s.closed?'is-closed':''},
        h('div',{className:'pd-li-top'},
         h('div',null,h('strong',null,s.website?h('a',{href:s.website,target:'_blank',rel:'noopener noreferrer'},s.name):s.name),h('span',null,s.industry+' · '+s.location)),
         h('button',{type:'button',className:'pd-ghost pd-small',onClick:()=>commit({...data,shortlist:data.shortlist.map(x=>x.id===s.id?{...x,closed:!x.closed}:x)})},s.closed?'Reopen':'Close'),
         h('button',{type:'button',className:'pd-remove','aria-label':'Remove '+s.name,onClick:()=>commit({...data,shortlist:data.shortlist.filter(x=>x.id!==s.id)},'Removed '+s.name)},'×')),
        h('ol',{className:'pd-track','aria-label':'Application progress for '+s.name},...STAGES.map((st,i)=>h('li',{key:st,className:i<idx?'past':i===idx?'now':''},
         h('button',{type:'button','aria-current':i===idx?'step':undefined,onClick:()=>setStage(st),title:'Mark as '+st},h('span',{className:'pd-dot','aria-hidden':true}),h('span',{className:'pd-step'},st),s.history?.[st]&&h('span',{className:'pd-date'},s.history[st].slice(5))))))
       );
      })),
     data.shortlist.length>0&&h('p',{className:'pd-fine'},'Offer Timeline: tap a step when you hear back. You update this yourself; employers aren’t connected yet.'),
     h('p',{className:'pd-fine'},'Directory records are demonstration data. Confirm sponsorship with each employer.')
    ),
    h('section',{className:'pd-card','aria-labelledby':'pd-check-title'},
     h('div',{className:'pd-head'},h('h3',{id:'pd-check-title'},'Work-ready checklist'),h('button',{type:'button',className:'pd-link',onClick:()=>onOpen('visa')},'Ask HireMeow →')),
     h('ul',{className:'pd-checks'},...CHECKLIST.map(([id,label])=>h('li',{key:id},h('label',{htmlFor:'pd-check-'+id,className:data.checklist[id]?'done':''},h('input',{type:'checkbox',id:'pd-check-'+id,checked:Boolean(data.checklist[id]),onChange:e=>commit({...data,checklist:{...data.checklist,[id]:e.target.checked}})}),label)))),
     h('p',{className:'pd-fine'},'General steps only. Confirm requirements for your case with Thai immigration or your university visa office.')
    )
   ),

   (lab.badges?.length>0||lab.dna)&&h('section',{className:'pd-card','aria-labelledby':'pd-lab-title'},
    h('div',{className:'pd-head'},h('h3',{id:'pd-lab-title'},'My Meow Lab results'),h('button',{type:'button',className:'pd-link',onClick:()=>onOpen('lab')},'Open Meow Lab →')),
    lab.dna&&h('p',{className:'pd-dna'},h('span',null,'MeowMatch DNA'),h('strong',null,lab.dna.type),' · best fit: '+lab.dna.top),
    lab.score&&h('p',{className:'pd-dna'},h('span',null,'Latest MeowScore'),h('strong',null,lab.score.score+'/100')),
    lab.badges?.length>0&&h('ul',{className:'lab-badges'},...lab.badges.map(b=>h('li',{key:b.id,className:'lab-badge lab-'+b.level},h('span',{'aria-hidden':true},b.icon),h('strong',null,b.title),h('small',null,b.level+' · '+b.date))))
   ),

   h('section',{className:'pd-card','aria-labelledby':'pd-notes-title'},
    h('h3',{id:'pd-notes-title'},h('label',{htmlFor:'pd-notes'},'My notes')),
    h('textarea',{id:'pd-notes',rows:4,maxLength:5000,value:data.notes,placeholder:'Interview dates, documents to collect, questions for the visa office…',onChange:e=>{const v=e.target.value;setData(d=>({...d,notes:v}));clearTimeout(notesTimer.current);notesTimer.current=setTimeout(()=>commit({...dataRef.current,notes:v},'Notes saved'),700);}})
   ),

   h('div',{className:'pd-footer'},
    h('span',null,data.updated?'Last saved '+new Date(data.updated).toLocaleString():'Nothing saved yet'),
    confirmWipe?h('span',{className:'pd-confirm'},'Delete your profile, applications and Meow Lab results on this device?',h('button',{type:'button',className:'pd-danger',onClick:()=>{wipe();try{localStorage.removeItem(LAB_KEY);}catch{}setData(structuredClone(EMPTY));setDraft(EMPTY.profile);setEditing(true);setConfirmWipe(false);setStatus('All your data was deleted from this device');}},'Yes, delete'),h('button',{type:'button',className:'pd-ghost',onClick:()=>setConfirmWipe(false)},'Keep it'))
    :h('button',{type:'button',className:'pd-ghost',onClick:()=>setConfirmWipe(true)},'Delete my data')
   )
  );
 };
}
