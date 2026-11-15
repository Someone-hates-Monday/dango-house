import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine';
import {initialState} from '../src/shared/director';
import {parseHousePlan,housePrompt,houseBeatPause,type HouseEvent,type HouseGenerate} from '../src/shared/house-events';
import {composeHouse,compactPositions} from '../src/shared/mini-house';
import {inHouseSilhouette} from '../src/HouseSkin';

const origin={backend:'model' as const,provider:'deepseek',model:'fixture'};
function live(){const s=initialState();s.settings.mode='api';s.settings.model='fixture';s.settings.autonomous=false;s.room.autonomous=false;return s;}
const event:HouseEvent={id:'fixture',kind:'pat',actor:'xia',at:1};
const raw=(actor='xia')=>JSON.stringify({beats:[{actor,text:'刚才聊到的那件事，我还记得。',intent:{action:'shy',emotion:'happy',duration:2}}]});
test('live touch/feed/praise use a generated house plan and preserve immediate reactions',async()=>{
 for(const action of [{type:'pat',id:'xia'},{type:'feed',id:'xia',food:'rice'},{type:'praise',id:'xia'}] as const){
  const s=live(),seen:string[]=[];const generate:HouseGenerate=async(state,e)=>{seen.push(e.kind);return parseHousePlan(raw(),state,e,origin);};
  const e=new GardenEngine(s,()=>{},undefined,0,generate);await e.dispatch(action);
  assert.equal(seen.length,1);assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,1);
  assert.equal(e.state.bodies.xia.interaction?.kind,action.type==='praise'?'affection':action.type);
  assert.equal(e.state.companionEvents.length,0,'do not record a completed event before the owned animation ends');
  e.tick(Date.now()+20000);assert.equal(e.state.companionEvents.length,1);
 }
});
test('private entry stays private and never leaks private history to the house planner',async()=>{
 const s=live();s.privateMessages.rin.push({id:'secret',speaker:'user',text:'PRIVATE_FIXTURE_DO_NOT_SHARE',at:1});
 const generate:HouseGenerate=async(state,e)=>{assert.ok(!housePrompt(state,e).includes('PRIVATE_FIXTURE_DO_NOT_SHARE'));return parseHousePlan(raw('rin'),state,e,origin);};
 const e=new GardenEngine(s,()=>{},undefined,0,generate);await e.dispatch({type:'private-open',id:'rin'});
 assert.ok(e.state.privateMessages.rin.some(m=>m.origin?.backend==='model'));
 assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,0);
 e.tick(Date.now()+20000);assert.ok(!JSON.stringify(e.state.companionEvents).includes('刚才聊到'));
});
test('stop invalidates an in-flight house response, with no late speech or memory',async()=>{
 const s=live();let finish!:(value:any)=>void;
 const e=new GardenEngine(s,()=>{},undefined,0,async()=>new Promise(resolve=>{finish=resolve;}));
 const pending=e.dispatch({type:'pat',id:'xia'});await e.dispatch({type:'stop'});
 finish(parseHousePlan(raw(),s,event,origin));await pending;e.tick(Date.now()+30000);
 assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,0);assert.equal(e.state.companionEvents.length,0);
});
test('API failure does not produce a local scripted character reply',async()=>{
 const e=new GardenEngine(live(),()=>{},undefined,0,async()=>{throw Error('fixture');});const before=e.state.messages.length;await e.dispatch({type:'pat',id:'xia'});
 assert.equal(e.state.messages.slice(before).filter(m=>m.speaker==='xia').length,0);assert.ok(e.state.messages.some(m=>m.kind==='error'));
});
test('hover cannot cancel a queued household reply',async()=>{
 const s=live();s.settings.autonomous=true;let calls=0;
 const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>{
  calls++;return parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'饭分你一点，好不好？',intent:{action:'shy'}},{actor:'rin',text:'好，我坐你旁边。',replyTo:'xia',intent:{action:'approach',target:'xia'}},{actor:'shiori',intent:{action:'think',emotion:'curious'}}]}),state,event,origin);
 });
 await e.dispatch({type:'pat',id:'xia'});await e.dispatch({type:'hover',id:'shiori'});
 e.tick(Date.now()+4000);
 assert.equal(calls,1);assert.ok(e.state.messages.some(m=>m.speaker==='rin'&&m.origin?.backend==='model'));
 e.tick(Date.now()+8500);assert.equal(e.state.bodies.shiori.emotion,'curious');
 assert.ok(!e.state.messages.some(m=>m.speaker==='shiori'&&m.origin?.backend==='model'),'silent listeners do not invent dialogue');
});
test('silent gestures and reply targets validate before execution, with readable turn pacing',()=>{
 const s=live(),plan=parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'这碗分你一半。',intent:{action:'eat'}},{actor:'rin',text:'我给你留了位置。',replyTo:'xia',intent:{action:'shy'}},{actor:'shiori',intent:{action:'think'}}]}),s,event,origin);
 assert.equal(plan.beats[1].replyTo,'xia');assert.equal(plan.beats[2].text,'');
 assert.ok(houseBeatPause(plan.beats[0])>=3400);assert.equal(houseBeatPause(plan.beats[2]),1100);
 assert.throws(()=>parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'hi',replyTo:'absent',intent:{action:'idle'}}]}),s,event,origin));
 assert.throws(()=>parseHousePlan(JSON.stringify({beats:[{actor:'xia',intent:{action:'shy'}}]}),s,event,origin));
});
test('leaving or enabling DND discards an already requested model response',async()=>{
 for(const action of [{type:'cast-present',id:'xia',present:false},{type:'settings',patch:{dnd:true}}] as const){
  const s=live();let finish!:(value:any)=>void;
  const e=new GardenEngine(s,()=>{},undefined,0,async()=>new Promise(resolve=>{finish=resolve;}));
  const plan=parseHousePlan(raw(),s,event,origin),pending=e.dispatch({type:'pat',id:'xia'});
  await e.dispatch(action);finish(plan);await pending;e.tick(Date.now()+30000);
  assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,0);assert.equal(e.state.companionEvents.length,0);
 }
});
test('an explicit interaction cannot silently accept an empty plan',()=>{
 const s=live();assert.throws(()=>parseHousePlan('{"beats":[]}',s,event,origin));
 assert.equal(parseHousePlan('{"beats":[]}',s,{...event,kind:'autonomous'},origin).beats.length,0);
});
test('a model gesture toward the viewer does not require an invented user avatar',()=>{
 const s=live();for(const target of ['你','用户','you','user']){
  const raw=JSON.stringify({beats:[{actor:'xia',text:'谢谢你的摸摸。',intent:{action:'shy',emotion:'happy',target}}]});
  const plan=parseHousePlan(raw,s,event,origin);assert.equal(plan.beats[0].intent.target,undefined);assert.equal(plan.beats[0].intent.action,'shy');
 }
});
test('house transparent corners are excluded from pointer capture',()=>{
 assert.equal(inHouseSilhouette(0,0,360,300),false);assert.equal(inHouseSilhouette(359,15,360,300),false);
 assert.equal(inHouseSilhouette(180,15,360,300),true);assert.equal(inHouseSilhouette(90,180,360,300),true);
 assert.equal(inHouseSilhouette(3,180,360,300),false);
});
test('house plans reject absent speakers, unknown targets and forbidden CG before execution',()=>{
 const s=live();s.presentIds=['xia'];assert.throws(()=>parseHousePlan(raw('rin'),s,event,origin));
 assert.throws(()=>parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'hi',intent:{action:'approach',target:'unknown'}}]}),s,event,origin));
 assert.throws(()=>parseHousePlan(JSON.stringify({beats:JSON.parse(raw()).beats,cgAsset:'gpt-close-t1'}),s,event,origin));
 s.connections.deepseek.tools=false;s.settings.provider='deepseek';assert.equal(parseHousePlan(raw(),s,event,origin).beats[0].intent.action,'idle');
});
test('roof host expansion keeps the house fixed and folds when headroom is insufficient',()=>{
 const work={x:0,y:0,width:1280,height:900},bounds={x:700,y:350,width:380,height:260};
 const a=composeHouse(bounds,work,{width:380,height:260,chatOpen:false,cgHeight:220},3);
 assert.equal(a.house.y,350);assert.equal(a.host.y,130);assert.equal(a.layout.cgHeight,220);
 const b=composeHouse({...bounds,y:30},work,{width:380,height:260,chatOpen:false,cgHeight:220},3);assert.equal(b.layout.cgHeight,0);assert.equal(b.house.y,30);
 const c=composeHouse(bounds,work,{width:9999,height:-50,chatOpen:true,cgHeight:0},7);assert.ok(c.host.x+c.host.width<=1280);assert.ok(c.host.y+c.host.height<=900);assert.ok(c.layout.height>=310);
});
test('compact formations remain in bounds across three and seven residents',()=>{
 for(const count of [3,7]){const ids=Array.from({length:count},(_,i)=>String(i)),positions=compactPositions(ids,count===3?320:420,count===3?140:230);assert.equal(new Set(positions.map(p=>p.id)).size,count);for(const p of positions){assert.ok(p.x>=45&&p.x<=count*100+400);assert.ok(p.y>=110);}assert.ok(Math.max(...positions.map(p=>p.x))-Math.min(...positions.map(p=>p.x))<=250);}
});
