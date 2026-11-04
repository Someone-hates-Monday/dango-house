// Acceptance checks beyond the existing happy-path tests. Run with --import tsx.
// Intentionally exits nonzero while the reviewed companionship contract is unmet.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine.ts';
import {initialState} from '../src/shared/director.ts';
import {generateReply} from '../electron/provider.ts';
const report={reviewedCursorHead:'bc486ab',checks:[]};
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,detail:e.message});}}
const engine=()=>new GardenEngine(initialState(),()=>{},undefined,0);

await check('cancelled story must not commit shared completion or pair reward',async()=>{
 const e=engine(),before={...e.state.bonds};await e.dispatch({type:'companion-story',id:'seat-share'});await e.dispatch({type:'stop'});
 assert.equal(e.state.companionEvents.some(x=>x.kind==='seat-share'),false,'seat-share recorded before the scene completed');
 assert.deepEqual(e.state.bonds,before);
});
await check('perform cannot animate an absent resident',async()=>{
 const e=engine();await e.dispatch({type:'cast-present',id:'grok',present:false});
 const before=JSON.stringify(e.state.bodies.grok);try{await e.dispatch({type:'perform',id:'grok',intent:{action:'wave'}});}catch{}
 assert.equal(JSON.stringify(e.state.bodies.grok),before,'absent Grok received a new action');
});
await check('approaching absent targets cannot create relationship changes',async()=>{
 const e=engine();await e.dispatch({type:'cast-present',id:'xia',present:false});const before={...e.state.bonds};
 try{await e.dispatch({type:'perform',id:'rin',intent:{action:'approach',target:'xia'}});}catch{}
 assert.deepEqual(e.state.bonds,before,'absent target still receives a bond bump');
});
await check('stopped story must abort its optional generation and suppress late output',async()=>{
 let resolve,signal;const pending=new Promise(r=>resolve=r);const e=new GardenEngine(initialState(),()=>{},async(_s,_id,_input,s)=>{signal=s;return pending;},0);
 e.state.settings.mode='api';e.state.settings.model='fixture';const job=e.dispatch({type:'companion-story',id:'seat-share'});
 await Promise.resolve();await e.dispatch({type:'stop'});resolve({text:'late-story-fixture',provider:'glm',model:'fixture'});await job;
 assert.equal(e.state.messages.some(m=>m.text==='late-story-fixture'),false,'late model aside appears after Stop');assert.ok(signal.aborted);
});
await check('real provider request must contain the story prompt and disable avatar tools',async()=>{
 const original=globalThis.fetch;let body;
 globalThis.fetch=async(_url,init)=>{body=JSON.parse(String(init.body));return new Response('data: {"choices":[{"delta":{"content":"fixture"}}]}\n\ndata: [DONE]\n\n');};
 try{
  const s=initialState();s.settings.mode='api';s.settings.model='fixture';s.connections.glm={model:'fixture',endpoint:'http://127.0.0.1:39999/v1',tools:true};
  const e=new GardenEngine(s,()=>{},(state,id,input,signal,update,act)=>generateReply(state,id,input,async()=> 'fixture-key',signal,update,act),0);
  await e.dispatch({type:'companion-story',id:'seat-share'});
  assert.ok(JSON.stringify(body).includes('极短的旁白'),'storyLlmPrompt is ignored by the actual provider path');assert.equal(body.tools,undefined);
 }finally{globalThis.fetch=original;}
});
await check('return notification must be idempotent for one private visit',async()=>{
 const e=engine();await e.dispatch({type:'private-open',id:'rin'});await e.dispatch({type:'private-return',id:'rin'});await e.dispatch({type:'private-return',id:'rin'});
 assert.equal(e.state.companionEvents.filter(x=>x.kind==='private-return').length,1,'duplicate return creates duplicate memory');
});
await check('reaction cannot overwrite a user story participant mid-scene',async()=>{
 const e=engine();await e.dispatch({type:'companion-story',id:'seat-share'});
 await e.dispatch({type:'pat',id:'xia'});await e.dispatch({type:'pat',id:'xia'});await e.dispatch({type:'pat',id:'xia'});
 const now=Date.now();e.tick(now+1200);
 assert.ok(!e.state.messages.some(m=>/并肩时间我先预约/.test(m.text)),'legacy rivalry bypasses the scene director priority');
});
fs.mkdirSync('test-results/cursor-review',{recursive:true});fs.writeFileSync('test-results/cursor-review/contracts.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(report.checks.some(c=>!c.pass))process.exitCode=1;
