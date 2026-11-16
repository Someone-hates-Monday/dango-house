import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,restoreState,ids} from '../src/shared/director';
import {GardenEngine} from '../electron/engine';
import {parseHousePlan,housePrompt,modelContextMessages} from '../src/shared/house-events';
import {characterVoiceReference} from '../src/shared/companion-voice';
import {generateReply} from '../electron/provider';

const origin={backend:'model' as const,provider:'deepseek',model:'fixture'};
function live(){const s=initialState();s.settings.mode='api';s.settings.model='fixture';s.settings.autonomous=false;s.room.autonomous=false;s.presentIds=['rin','xia','shiori'];s.messages=[];s.presentation.surface='house';return s;}
const scene={focus:'companions',playMode:'self-play',beats:[
 {actor:'rin',text:'好，我去找她待会儿。',stay:true,intent:{action:'wave'}},
 {actor:'rin',text:'大鱼，靠近一点？',intent:{action:'approach',target:'xia',emotion:'shy'}},
 {actor:'xia',text:'好呀，今天想和你挨着。',replyTo:'rin',intent:{action:'shy',emotion:'happy'}},
],cgAsset:'rin-xia-cheek-t1'};

test('a semantic companion decision unlocks a complete scene without invitation keywords',()=>{
 const s=live(),event={id:'invite',kind:'message',text:'Claude怎么不找大肥鱼玩？',at:1};
 const plan=parseHousePlan(JSON.stringify(scene),s,event,origin);
 assert.equal(plan.focus,'companions');assert.equal(plan.cgAsset,'rin-xia-cheek-t1');assert.equal(plan.playMode,'self-play');
 const touch=parseHousePlan(JSON.stringify(scene),s,{...event,kind:'pat',actor:'rin'},origin);
 assert.equal(touch.focus,'user');assert.equal(touch.cgAsset,undefined);assert.equal(touch.playMode,undefined);
 assert.throws(()=>parseHousePlan(JSON.stringify({...scene,focus:'unknown'}),s,event,origin));
});

test('public invitations execute actual movement, conversation and one shared CG after completion',async()=>{
 const s=live();s.room.residents.rin={...s.room.residents.rin,x:15,y:50};s.room.residents.xia={...s.room.residents.xia,x:80,y:90};
 const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>parseHousePlan(JSON.stringify(scene),state,event,origin));
 await e.dispatch({type:'send',text:'Claude怎么不找大肥鱼玩？'});
 assert.equal(s.settings.housePlayMode,'self-play');assert.equal(e.state.cgSession,undefined);
 let moved=false;const start=Date.now();for(let t=start;t<start+60000;t+=250){e.tick(t);moved||=!!s.room.residents.rin.arrivesAt;}
 assert.ok(moved);assert.ok(s.messages.some(m=>m.speaker==='xia'&&m.origin?.backend==='model'));
 assert.equal(s.cgSession?.asset,'rin-xia-cheek-t1');assert.ok(s.cgSession?.id);
 assert.equal(restoreState(s).settings.housePlayMode,'self-play');
 assert.match(housePrompt(s,{id:'idle',at:1,kind:'autonomous'}),/House play mode: self-play/);
});

test('private invitation finishes the private reply then starts a public visit without private context',async()=>{
 const s=live();const events:any[]=[];
 const e=new GardenEngine(s,()=>{},async(_s,_id,_text,_signal,update,_act,invite)=>{
  assert.ok(invite);invite!({target:'xia',topic:'一起靠近待会儿',playMode:'self-play'});update('好，我去找她。');return{text:'好，我去找她。',provider:'deepseek',model:'fixture'};
 },0,async(state,event)=>{events.push(event);assert.equal(event.kind,'visit');assert.ok(!JSON.stringify(event).includes('PRIVATE_SECRET'));assert.ok(!housePrompt(state,event).includes('PRIVATE_SECRET'));return parseHousePlan(JSON.stringify({...scene,playMode:null}),state,event,origin);});
 await e.dispatch({type:'private-send',id:'rin',text:'PRIVATE_SECRET；你去找大鱼玩吧，我有事。'});
 assert.equal(events.length,1);assert.equal(events[0].target,'xia');
 assert.ok(s.privateMessages.rin.some(m=>m.speaker==='rin'&&m.text==='好，我去找她。'));
 assert.ok(!s.messages.some(m=>m.text.includes('PRIVATE_SECRET')));assert.equal(s.settings.housePlayMode,'self-play');
});

test('cancelled private replies never launch late invitations or change play mode',async()=>{
 const s=live();let finish!:(value:string)=>void;let ready!:()=>void;const started=new Promise<void>(resolve=>{ready=resolve;});let calls=0;
 const e=new GardenEngine(s,()=>{},async(_s,_id,_text,_signal,_update,_act,invite)=>{invite!({target:'xia',playMode:'self-play'});return new Promise(resolve=>{finish=resolve;ready();});},0,async()=>{calls++;throw Error('must not run');});
 const pending=e.dispatch({type:'private-send',id:'rin',text:'去找她玩吧'});await started;await e.dispatch({type:'stop'});finish('好');await pending;
 assert.equal(calls,0);assert.equal(s.settings.housePlayMode,undefined);
});

test('model-facing cards do not reinforce props in routine dialogue',()=>{
 for(const id of ids){const card=characterVoiceReference(id,'zh-CN');
  assert.ok(!/书|饭碗|尾巴|收费|月光|喵/.test(card.persona+card.styleExamples.map(e=>e.text).join('')),id);
 }
 const prompt=housePrompt(live(),{id:'test',at:1,kind:'message',text:'去找大肥鱼玩吧'});
 assert.ok(prompt.includes('大肥鱼'));assert.ok(prompt.includes('invite')||prompt.includes('invites'));
});

test('obsolete voice prose is not replayed, while visible history and explicit memories remain',()=>{
 const s=live();s.messages=[{id:'old-user',at:1,speaker:'user',text:'OLD_TOPIC'},
  {id:'old-model',at:2,speaker:'rin',text:'OLD_PROP_OBSESSION',origin:{backend:'model',provider:'fixture'}},
  {id:'current',at:3,speaker:'user',text:'CURRENT_TOPIC'}];
 s.memories=[{id:'fact',at:1,text:'EXPLICIT_USER_MEMORY'}];
 assert.deepEqual(modelContextMessages(s).map(m=>m.text),['CURRENT_TOPIC']);
 assert.ok(housePrompt(s,{id:'test',at:1,kind:'message'}).includes('EXPLICIT_USER_MEMORY'));
 s.messages.push({id:'new-model',at:4,speaker:'rin',text:'NEW_REPLY',origin:{backend:'model',voiceRevision:3}});
 assert.deepEqual(modelContextMessages(s).map(m=>m.text),['CURRENT_TOPIC','NEW_REPLY']);
 assert.equal(s.messages[1].text,'OLD_PROP_OBSESSION','the user transcript is never deleted');
});

test('autonomous plans cannot silently rewrite user availability',()=>{
 const s=live();s.settings.housePlayMode='self-play';
 const plan=parseHousePlan(JSON.stringify({...scene,playMode:'together'}),s,{id:'auto',kind:'autonomous',at:1},origin);
 assert.equal(plan.playMode,undefined);
 const back=parseHousePlan(JSON.stringify({focus:'user',playMode:'together',beats:[scene.beats[0]]}),s,{id:'back',kind:'message',at:1,text:'我忙完了'},origin);
 assert.equal(back.playMode,'together');
});

test('private invitation tool works on both OpenAI-compatible and Anthropic streams',async()=>{
 const original=globalThis.fetch;
 try{for(const provider of ['deepseek','claude']){
  const s=live();s.settings.provider=provider;s.connections[provider]={model:'fixture',endpoint:'http://127.0.0.1:39999'+(provider==='claude'?'/messages':'/chat/completions'),tools:true};let count=0;const invited:any[]=[];
  globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body));count++;
   if(count===1){assert.equal(body.tools.length,2);const args={target:'xia',topic:'一起玩',playMode:'self-play'};
    if(provider==='claude')return new Response('data: '+JSON.stringify({type:'content_block_start',index:0,content_block:{type:'tool_use',id:'visit',name:'invite_companion'}})+'\n\ndata: '+JSON.stringify({type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify(args)}})+'\n\n');
    return new Response('data: '+JSON.stringify({choices:[{delta:{tool_calls:[{index:0,id:'visit',function:{name:'invite_companion',arguments:JSON.stringify(args)}}]}}]})+'\n\n');
   }
   return new Response('data: '+JSON.stringify(provider==='claude'?{type:'content_block_delta',delta:{type:'text_delta',text:'好，我去找她玩。'}}:{choices:[{delta:{content:'好，我去找她玩。'}}]})+'\n\ndata: [DONE]\n\n');
  };
  const result=await generateReply(s,'rin','你去找大鱼玩吧',async()=> 'fixture',new AbortController().signal,()=>{},()=> 'OK',undefined,r=>{invited.push(r);return 'queued, not arrived';});
  assert.equal(result.text,'好，我去找她玩。');assert.equal(invited[0].target,'xia');assert.equal(count,2);
 }}finally{globalThis.fetch=original;}
});
