import {QUESTIONS, SOURCES, REVIEWED, answerQuestion} from './career-knowledge.js';
import {getChatStatus} from './hiremeow-live.js';
export {answerQuestion};
export function createCareerChat(React) {
 const h=React.createElement;
 const onClaude=()=>typeof window!=='undefined'&&Boolean(window.claude?.use);
 function liveBlock(block,index){
  let cursor=0;const parts=[];
  for(const [i,citation] of [...block.citations].sort((a,b)=>a.start-b.start).entries()){
   if(citation.start<cursor)continue;
   parts.push(block.text.slice(cursor,citation.start));
   parts.push(h('a',{key:'cite-'+i,href:citation.url,target:'_blank',rel:'noopener noreferrer',title:citation.title},'['+citation.title+']'));
   cursor=citation.end;
  }
  parts.push(block.text.slice(cursor));
  return h('p',{key:index,className:'career-live-text'},...parts);
 }
 function AnswerContent({message,onAsk,onNavigate}) {
  const answer=message.answer;
  if(!answer)return h('span',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},message.text);
  return h('div',{className:'career-answer'},
   h('p',{className:'career-answer-title'},answer.title),
   answer.notice&&h('p',{className:'career-live-error'},answer.notice),
   ...(answer.blocks?answer.blocks.map(liveBlock):answer.paragraphs.map((p,i)=>h('p',{key:i},p))),
   answer.live&&h('p',{className:'career-reviewed'},answer.searched?'AI answer · Web sources consulted. Confirm decisions with the responsible authority.':'AI answer · No web search used for this reply.'),
   answer.sources?.length>0&&h('div',{className:'career-sources'},h('strong',null,'Check the source'),...answer.sources.map(key=>h('a',{key,href:SOURCES[key][1],target:'_blank',rel:'noopener noreferrer'},SOURCES[key][0]+' ↗'))),
   answer.action&&h('button',{type:'button',className:'career-link-button',onClick:()=>onNavigate(answer.action)},answer.action==='resume'?'Open Resume Feedback →':'Open Employer Directory →'),
   answer.suggestions&&h('div',{className:'career-suggestions'},...answer.suggestions.map(id=>h('button',{key:id,type:'button',onClick:()=>onAsk(QUESTIONS[id-1].question)},QUESTIONS[id-1].question))),
   answer.sources?.length>0&&h('p',{className:'career-reviewed'},'Library reviewed '+REVIEWED+'. General information; confirm your own case with the responsible authority.')
  );
 }
 function QuestionInput({onAsk,onClear,busy}) {
  const [question,setQuestion]=React.useState('');
  const [filter,setFilter]=React.useState('');
  const [error,setError]=React.useState('');
  const [status,setStatus]=React.useState(null);
  const [webSearch,setWebSearch]=React.useState(true);
  React.useEffect(()=>{let active=true;getChatStatus().then(s=>{if(active)setStatus(s);});return()=>{active=false;};},[]);
  const field=React.useRef(null);
  const submit=(text)=>{if(busy)return;const q=text.trim();if(!q){setError('Type a question first.');field.current?.focus();return;}try{onAsk(q,{webSearch});setQuestion('');setError('');field.current?.focus();}catch(e){setError(e.message||'Please try again.');}};
  const visible=QUESTIONS.filter(q=>(q.question+' '+q.aliases.join(' ')).toLowerCase().includes(filter.toLowerCase()));
  return h('section',{className:'career-input-panel','aria-label':'Ask a career question'},
   h('div',{className:'career-input-heading'},h('label',{htmlFor:'career-question'},'What’s on your mind?'),h('span',{className:'career-live-status','data-live':Boolean(status?.available)},status===null?'Checking chat connection…':status.available?'AI chat connected':status.signInRequired?'Sign in for live AI':'Saved guidance')),
   h('form',{onSubmit:e=>{e.preventDefault();submit(question);}},
    h('textarea',{id:'career-question',ref:field,value:question,onChange:e=>{setQuestion(e.target.value);setError('');},rows:3,maxLength:16000,placeholder:'Ask about visas, finding work, or your next career move…','aria-describedby':'career-question-help',disabled:busy,onKeyDown:e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();submit(question);}}}),
    h('div',{className:'career-form-bottom'},h('p',{id:'career-question-help'},'Enter to send · Shift + Enter for a new line'),h('button',{type:'submit',disabled:busy||!question.trim()},busy?'Please wait…':'Send question →')),
    error&&h('p',{role:'alert',className:'career-error'},error)
   ),
   status?.webSearch&&h('label',{className:'career-web-toggle'},h('input',{type:'checkbox',checked:webSearch,disabled:busy,onChange:e=>setWebSearch(e.target.checked)}),'Search the web when useful'),
   h('div',{className:'career-quick'},...[[4,'After graduation'],[6,'Part-time work'],[11,'Fees & timing'],[28,'Review my resume']].map(([id,label])=>h('button',{type:'button',key:id,disabled:busy,onClick:()=>submit(QUESTIONS[id-1].question)},label))),
   h('details',{className:'career-all-questions'},h('summary',null,'Explore common questions'),
    h('label',{className:'career-search-label',htmlFor:'career-faq-search'},'Find a question'),
    h('input',{id:'career-faq-search',type:'search',value:filter,onChange:e=>setFilter(e.target.value),placeholder:'Search topics…'}),
    h('div',{className:'career-question-list'},visible.length?visible.map(q=>h('button',{key:q.id,type:'button',disabled:busy,onClick:()=>submit(q.question)},h('span',null,String(q.id).padStart(2,'0')),h('span',null,q.question))):h('p',null,'No matching questions. Try a shorter search.'))
   ),
   h('div',{className:'career-privacy'},h('p',null,status?.available?`Recent messages are sent to ${onClaude()?'Claude':'OpenAI'} for live answers. Avoid sharing sensitive documents.`:status?.signInRequired?'Sign in (top right) to get live AI answers. Saved guidance works without an account.':'Live AI is not connected yet. Saved guidance works without sending questions to an AI service.'),h('button',{type:'button',onClick:()=>{setQuestion('');setFilter('');setError('');onClear();}},busy?'Cancel & clear':'Clear chat')),
   status?.available&&(onClaude()
    ?h('details',{className:'career-ai-disclosure'},h('summary',null,'How your conversation is used'),h('p',null,'HireMeow keeps this conversation in page memory and does not save it. For each live answer, your question and a few recent messages are sent to Claude using your own Claude account, and the first question asks for your permission. Live answers here do not search the web, so confirm current rules with official sources. Clearing the chat removes this page’s conversation.'),h('a',{href:'https://www.anthropic.com/legal/privacy',target:'_blank',rel:'noopener noreferrer'},'Anthropic privacy policy'))
    :h('details',{className:'career-ai-disclosure'},h('summary',null,'How your conversation is used'),h('p',null,'HireMeow keeps this conversation in page memory and does not save it. For each live answer, your question and up to ten recent messages are sent to OpenAI. If enabled, generated search queries are sent to web search providers. Turn search off when reviewing personal text. Clearing the chat removes this page’s conversation; provider records may still be retained.'),h('a',{href:'https://openai.com/policies/privacy-policy/',target:'_blank',rel:'noopener noreferrer'},'OpenAI privacy policy'),h('span',null,' · '),h('a',{href:'https://privacy.openai.com/',target:'_blank',rel:'noopener noreferrer'},'Request provider data deletion'))),
   h('p',{className:'career-guided-label'},'Or continue with the guided visa choices below')
  );
 }
 return {QuestionInput,AnswerContent};
}
