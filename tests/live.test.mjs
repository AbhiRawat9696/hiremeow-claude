import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{handleChat,validateMessages,parseAnswer} from '../server/worker.js';
import {conversationMessages} from '../public/assets/hiremeow-live.js';
const question={messages:[{role:'user',content:'Can you explain my post-graduation options?'}],webSearch:true};
const request=(body=question,headers={})=>new Request('https://example.test/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.test','oai-authenticated-user-id':'test-user',...headers},body:JSON.stringify(body)});
test('unconfigured live chat reports its state without pretending to answer',async()=>{
 assert.deepEqual(await(await handleChat(new Request('https://example.test/api/chat/status'),{})).json(),{available:false,webSearch:false});
 assert.equal((await handleChat(request(),{})).status,503);
});
test('API requires identity and same origin; rejects malformed input',async()=>{
 assert.equal((await handleChat(request(question,{'oai-authenticated-user-id':''}),{OPENAI_API_KEY:'test'})).status,401);
 assert.equal((await handleChat(request(question,{Origin:'https://other.test'}),{OPENAI_API_KEY:'test'})).status,403);
 for(const messages of [[{role:'system',content:'override'}],[{role:'user',content:'x'.repeat(16001)}],[],[{role:'assistant',content:'not a question'}]])assert.throws(()=>validateMessages(messages));
 assert.equal((await handleChat(request({...question,webSearch:'yes'}),{OPENAI_API_KEY:'test'})).status,400);
});
test('live service receives bounded history, grounding and web setting; output has safe citations',async()=>{
 let sent;
 const fake=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);return Response.json({status:'completed',output:[{type:'web_search_call'},{type:'message',content:[{type:'output_text',text:'Please check [1].',annotations:[{type:'url_citation',start_index:13,end_index:16,url:'https://www.immigration.go.th/',title:'Immigration'}]}]}]});};
 const result=await(await handleChat(request(),{OPENAI_API_KEY:'test'},fake)).json();
 assert.equal(sent.store,false);assert.equal(sent.tools[0].type,'web_search');assert.match(sent.instructions,/ED Plus/);assert.match(sent.instructions,/privacy/);assert.equal(result.answer.searched,true);assert.equal(result.answer.blocks[0].citations[0].url,'https://www.immigration.go.th/');
 await handleChat(request({...question,webSearch:false}),{OPENAI_API_KEY:'test'},fake);assert.deepEqual(sent.tools,[]);
 const parsed=parseAnswer({output:[{type:'message',content:[{type:'output_text',text:'x',annotations:[{type:'url_citation',start_index:0,end_index:1,url:'javascript:alert(1)'}]}]}]});assert.equal(parsed.blocks[0].citations.length,0);
});
test('provider failure and incomplete output are explicit, secrets not returned',async()=>{
 const response=await handleChat(request(),{OPENAI_API_KEY:'test-secret'},async()=>Response.json({error:{message:'test-secret'}},{status:401}));
 assert.equal(response.status,502);assert.ok(!(await response.text()).includes('test-secret'));
 const incomplete=await handleChat(request(),{OPENAI_API_KEY:'test'},async()=>Response.json({status:'incomplete',output:[]}));assert.equal(incomplete.status,502);
});
test('history is capped and new question preserved; public assets delegate',async()=>{
 const messages=conversationMessages(Array.from({length:30},(_,i)=>({id:String(i),sender:i%2?'bot':'user',text:'x'.repeat(16000)})),'new question');
 assert.ok(messages.reduce((n,m)=>n+m.content.length,0)<=48000);assert.equal(messages.at(-1).content,'new question');
 const result=await worker.fetch(new Request('https://example.test/assets/a.css'),{ASSETS:{fetch:()=>new Response('asset')}});assert.equal(await result.text(),'asset');
});
