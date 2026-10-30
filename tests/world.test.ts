import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine.ts';
import {initialState,restoreState,ids} from '../src/shared/director.ts';
import {validatedIntent,residentPosition} from '../src/shared/world.ts';
import {socialScenes} from '../src/shared/social.ts';
import {endpointFor} from '../electron/avatar-tool.ts';
import {requestText} from '../electron/provider.ts';

test('ambient life leaves long quiet intervals instead of waving every few seconds',()=>{
  const start=Date.now();const e=new GardenEngine();
  e.tick(start+59000);assert.equal(e.state.room.log.length,0);
  e.tick(start+61000);assert.equal(e.state.room.log.length,1);assert.equal(e.state.room.log[0].text.includes('挥手'),false);
  e.tick(start+90000);assert.equal(e.state.room.log.length,1);
  assert.equal(e.state.messages.some(m=>m.text.includes('窗边的位置')),false);
});

test('animation intent validates capabilities and bounded room movements settle',()=>{
  assert.throws(()=>validatedIntent({action:'execute_shell'}));
  const e=new GardenEngine();const t=Date.now();e.perform('xia',{action:'walk',x:999,y:-99,duration:999},'model',t);
  const r=e.state.room.residents.xia;assert.equal(r.x,92);assert.equal(r.y,48);assert.ok(residentPosition(r,t+200).x<92);
  e.tick(t+30000);assert.equal(e.state.bodies.xia.pose,'idle');assert.equal(e.state.room.residents.xia.arrivesAt,0);
});
test('all seven are covered by scenes and directed relationships persist separately',async()=>{
  assert.deepEqual([...new Set(socialScenes.flatMap(s=>s.cast))].sort(),[...ids].sort());
  const e=new GardenEngine();const before=e.state.bonds['rin>xia'];e.perform('rin',{action:'approach',target:'xia'});assert.equal(e.state.bonds['rin>xia'],before+2);assert.equal(e.state.bonds['xia>rin'],35);
  await e.dispatch({type:'social-scene',id:'cat-fox'});const t=Date.now();e.tick(t+4500);assert.ok(e.state.messages.some(m=>m.speaker==='glm'&&m.text.includes('点心预算')));
  assert.equal(restoreState(e.state).bonds['rin>xia'],before+2);
});
test('private greeting, touch and favorite food affect affection with private context isolation',async()=>{
  let received:string[]=[];const e=new GardenEngine(initialState(),()=>{},async(s)=>{received=s.messages.map(m=>m.text);return '我在认真听。';},0);
  const n=e.state.affection.xia;await e.dispatch({type:'feed',id:'xia',food:'rice'});await e.dispatch({type:'pat',id:'xia'});assert.equal(e.state.affection.xia,n+6);
  await e.dispatch({type:'relationship',mode:'romance',userName:'小明',address:'老公'});await e.dispatch({type:'private-open',id:'kimi'});assert.match(e.state.privateMessages.kimi[0].text,/老公/);const count=e.state.privateMessages.kimi.length;await e.dispatch({type:'private-open',id:'kimi'});assert.equal(e.state.privateMessages.kimi.length,count);
  e.state.settings.mode='api';await e.dispatch({type:'private-send',id:'kimi',text:'私聊独有的秘密'});assert.ok(received.includes('私聊独有的秘密'));assert.equal(received.includes(e.state.messages[1].text),false);assert.equal(e.state.messages.some(m=>m.text==='私聊独有的秘密'),false);
});
test('DND freezes current actions and queued reactions; reminders run once per interval',async()=>{
  const e=new GardenEngine();await e.dispatch({type:'social-scene',id:'grok-gpt'});await e.dispatch({type:'settings',patch:{dnd:true}});const count=e.state.messages.length;e.tick(Date.now()+20000);assert.equal(e.state.messages.length,count);assert.ok(ids.every(id=>e.state.bodies[id].pose==='idle'));
  await e.dispatch({type:'room-settings',patch:{autonomous:false}});await e.dispatch({type:'reminder',operation:'add',text:'起来伸懒腰',intervalMinutes:1});await e.dispatch({type:'settings',patch:{dnd:false}});e.tick(Date.now()+61000);const after=e.state.messages.filter(m=>m.text.includes('起来伸懒腰')).length;e.tick(Date.now()+62000);assert.equal(e.state.messages.filter(m=>m.text.includes('起来伸懒腰')).length,after);assert.equal(after,1);
});
test('layout, service profiles and role preferences survive restore; transient moves reset',async()=>{
  const e=new GardenEngine();await e.dispatch({type:'connection',provider:'kimi',profile:{endpoint:'https://example.com/v1',model:'my-model',tools:true}});await e.dispatch({type:'furniture',operation:'add',kind:'plant',x:50,y:70});await e.dispatch({type:'relationship',mode:'pet',userName:'明',address:'主人'});const r=restoreState(e.state);assert.equal(r.connections.kimi.model,'my-model');assert.equal(r.room.furniture.length,7);assert.equal(r.relationship.address,'主人');assert.deepEqual(r.desktopMoves,{});
});
test('tool loop accumulates streamed arguments, executes avatar action and returns spoken reply',async()=>{
  const original=globalThis.fetch;const bodies:any[]=[];let actions:any[]=[];
  const event=(delta:any)=>'data: '+JSON.stringify({choices:[{delta}]})+'\n\n';
  globalThis.fetch=async(_url,options)=>{bodies.push(JSON.parse(options!.body as string));return new Response(bodies.length===1?event({reasoning_content:'hidden',tool_calls:[{index:0,id:'call1',function:{name:'perform_action',arguments:'{"action":"wa'}}]})+event({tool_calls:[{index:0,function:{arguments:'ve","emotion":"happy"}'}}]}):event({content:'向你挥手啦！'})+'data: [DONE]\n\n');};
  try{const reply=await requestText('kimi','test','fake','system',[{role:'user',content:'挥手'}],new AbortController().signal,()=>{},{act:intent=>{actions.push(intent);return '完成';}});assert.equal(reply,'向你挥手啦！');assert.equal(actions[0].action,'wave');assert.equal(bodies[1].messages.at(-1).role,'tool');assert.equal(bodies[1].messages.at(-2).reasoning_content,'hidden');assert.equal(reply.includes('hidden'),false);}finally{globalThis.fetch=original;}
});
test('endpoint normalization preserves full URLs and rejects insecure remote endpoints',()=>{
  assert.equal(endpointFor('https://example.com/v1','',false),'https://example.com/v1/chat/completions');assert.equal(endpointFor('https://example.com/v1/messages','',true),'https://example.com/v1/messages');assert.throws(()=>endpointFor('http://remote.example/v1','',false));
});
