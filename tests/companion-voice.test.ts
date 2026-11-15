import test from 'node:test';
import assert from 'node:assert/strict';
import {generateReply,generateHousePlan} from '../electron/provider';
import {GardenEngine} from '../electron/engine';
import {initialState,ids} from '../src/shared/director';
import {characterVoiceReference} from '../src/shared/companion-voice';
import {parseHousePlan} from '../src/shared/house-events';
import {patLine} from '../src/shared/dialogue/pack';

const origin={backend:'model' as const,provider:'deepseek',model:'fixture'};
const live=()=>{const s=initialState();s.settings.mode='api';s.settings.provider='deepseek';s.settings.model='fixture';s.settings.autonomous=false;s.room.autonomous=false;s.messages=[];return s;};

test('voice references are bounded, localized and distinguish all seven personalities',()=>{
 for(const locale of ['zh-CN','en','ja'] as const)for(const id of ids){
  const card=characterVoiceReference(id,locale,'pat');
  assert.equal(card.id,id);assert.equal(card.styleExamples.length,2);
  assert.ok(card.styleExamples.every(e=>e.situation!=='touch'&&e.text.length>0));
 }
 assert.notEqual(characterVoiceReference('rin','zh-CN').tone,characterVoiceReference('shiori','zh-CN').tone);
});

test('private API gets the actual input and reference cards, and returns model text unchanged',async()=>{
 const state=live();state.connections.deepseek={model:'fixture',endpoint:'http://127.0.0.1:39999/v1',tools:false};
 // Callers can supply a fresh input even if history ends with an older user turn.
 state.messages=[{id:'prior',at:1,speaker:'user',text:'旧话题'}];
 const original=globalThis.fetch;let body:any;
 globalThis.fetch=async(_url,init)=>{body=JSON.parse(String(init?.body));return new Response('data: '+JSON.stringify({choices:[{delta:{content:'今天想安静地陪着你。'}}]})+'\n\ndata: [DONE]\n\n');};
 try{
  const reply=await generateReply(state,'rin','今天想安静待会儿',async()=> 'fixture-key',new AbortController().signal,()=>{});
  assert.equal(reply.text,'今天想安静地陪着你。');
  assert.equal(body.messages.at(-1).content,'用户：今天想安静待会儿');
  assert.ok(body.messages[0].content.includes('styleExamples'));
  assert.ok(body.messages[0].content.includes('NOT conversation history'));
  assert.ok(!body.messages[0].content.includes('表达不满'));
  assert.notEqual(reply.text,patLine('zh-CN','rin'));
 }finally{globalThis.fetch=original;}
});

test('house and private generation share voice guidance; a headpat never selects a canned reply',async()=>{
 const s=live();s.presentIds=['rin'];s.connections.deepseek={model:'fixture',endpoint:'http://127.0.0.1:39999/v1',tools:true};
 let body:any,calls=0;const original=globalThis.fetch;
 globalThis.fetch=async(_url,init)=>{calls++;body=JSON.parse(String(init?.body));return new Response('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify({beats:[{actor:'rin',text:'唔，手心暖暖的。',intent:{action:'shy',emotion:'happy'}}]})}}]})+'\n\ndata: [DONE]\n\n');};
 try{
  const plan=await generateHousePlan(s,{id:'pat',kind:'pat',actor:'rin',at:1},async()=> 'fixture-key',new AbortController().signal);
  assert.equal(calls,1);assert.equal(plan.beats[0].text,'唔，手心暖暖的。');
  assert.equal(plan.origin.backend,'model');
  assert.ok(body.messages[0].content.includes('Current interaction guidance:'));
  assert.ok(!body.messages[0].content.includes(patLine('zh-CN','rin')),'the matching canned headpat line is not offered to replay');
 }finally{globalThis.fetch=original;}
});

test('missing private API generator reports a connection problem instead of replaying demo text',async()=>{
 const e=new GardenEngine(live());await e.dispatch({type:'private-send',id:'rin',text:'我今天很开心'});
 assert.equal(e.state.privateMessages.rin.filter(m=>m.speaker==='rin').length,0);
 assert.ok(e.state.privateMessages.rin.some(m=>m.speaker==='system'));
 assert.equal(e.state.settings.mode,'api');
});

test('API reminders deliver the user notification, then use model dialogue without interrupting a busy scene',async()=>{
 for(const busy of [false,true]){
  const s=live();s.busy=busy;s.presentIds=['rin'];s.reminders=[{id:'water',text:'喝水',enabled:true,intervalMinutes:30,nextAt:1}];
  let calls=0;
  const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>{
   calls++;assert.equal(event.kind,'reminder');assert.equal(event.text,'喝水');
   return parseHousePlan(JSON.stringify({beats:[{actor:'rin',text:'我也倒了一杯，一起歇会儿吧。',intent:{action:'wave'}}]}),state,event,origin);
  });
  e.tick(Date.now());await new Promise(resolve=>setImmediate(resolve));
  assert.ok(e.state.messages.some(m=>m.speaker==='system'&&m.text==='喝水'));
  assert.equal(calls,busy?0:1);
  const speech=e.state.messages.filter(m=>m.speaker==='rin');
  assert.equal(speech.length,busy?0:1);
  if(!busy)assert.equal(speech[0].origin?.backend,'model');
 }
});
