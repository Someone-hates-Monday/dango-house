import test from 'node:test';import assert from 'node:assert/strict';
import {houseSpeeches,placeHouseSpeeches} from '../src/shared/house-speech';
import {initialState,restoreState} from '../src/shared/director';
import {GardenEngine} from '../electron/engine';
import {parseHousePlan,housePrompt,needsHousePartner} from '../src/shared/house-events';
import type {CharacterId} from '../src/shared/types';

const origin={backend:'model' as const,provider:'fixture',model:'fixture'};
function live(){const s=initialState();s.settings.mode='api';s.settings.autonomous=false;s.room.autonomous=false;s.messages=[];s.presentIds=['xia','rin','shiori'];s.presentation.surface='house';return s;}

test('each resident owns one recent bubble and only the open private transcript can appear',()=>{
 const s=live();s.messages=[{id:'old',speaker:'xia',text:'older',at:1000},{id:'new',speaker:'xia',text:'new',at:2000,replyTo:'rin',audience:'companions'},
  {id:'reply',speaker:'rin',text:'reply',at:3000,replyTo:'xia',audience:'companions'},{id:'gone',speaker:'grok',text:'absent',at:4000}];
 s.privateMessages.rin=[{id:'private',speaker:'rin',text:'private',at:4000}];s.privateMessages.shiori=[{id:'secret',speaker:'shiori',text:'OTHER_SECRET',at:4000}];
 assert.deepEqual(houseSpeeches(s,undefined,4000).map(m=>m.text),['reply','new']);
 const open=houseSpeeches(s,'rin',4000);assert.equal(open[0].text,'private');assert.equal(open[0].private,true);assert.equal(open[0].audience,'user');
 assert.ok(!open.some(m=>m.text==='OTHER_SECRET'));assert.deepEqual(houseSpeeches(s,undefined,18000),[]);
 s.settings.dnd=true;assert.deepEqual(houseSpeeches(s,'rin',4000),[]);
});

test('speech placement stays inside fixed headroom without overlapping at compact and wide sizes',()=>{
 const ids:CharacterId[]=['xia','rin','shiori','gemini','glm','kimi','grok'];
 for(const width of [320,380,420,760]){
  const height=Math.round(Math.min(360,width*.82)*9/16+46);
  const speeches=ids.map((speaker,i)=>({id:speaker,speaker,text:'hello',at:i,private:false}));
  const placed=placeHouseSpeeches(speeches,ids.map((id,i)=>({id,x:width*(.2+i*.1)})),width,height);
  assert.ok(placed.length>=3);assert.equal(placed.filter(p=>p.active).length,1);
  for(const a of placed){assert.ok(a.left>=0&&a.left+a.width<=width);assert.ok(a.top>=-height&&a.top+a.height<=0);assert.ok(a.tail>=0&&a.tail<a.width);
   for(const b of placed)if(a.id!==b.id)assert.ok(a.left+a.width<=b.left||b.left+b.width<=a.left||a.top+a.height<=b.top||b.top+b.height<=a.top);
  }
 }
 assert.deepEqual(placeHouseSpeeches([{id:'one',speaker:'rin',text:'hi',at:1,private:false}],[],320,0),[]);
});

test('directed speech survives actual arrival and carries its scene without replacing dispatch time',async()=>{
 const s=live();s.room.residents.rin={...s.room.residents.rin,x:85,y:90};s.room.residents.xia={...s.room.residents.xia,x:20,y:50};
 const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>parseHousePlan(JSON.stringify({beats:[
  {actor:'rin',text:'要一起玩这个吗？',audience:'companions',replyTo:'xia',intent:{action:'approach',target:'xia',duration:1}},
  {actor:'xia',text:'好呀，你先来。',audience:'companions',replyTo:'rin',intent:{action:'wave',duration:1}},
 ]}),state,event,origin));
 const start=Date.now();await e.dispatch({type:'companion-visit',id:'rin',target:'xia'});
 assert.equal(s.messages.length,0,'speech waits for arrival');
 for(let t=start;t<start+30000;t+=250)e.tick(t);
 assert.equal(s.messages[0].replyTo,'xia');assert.equal(s.messages[1].replyTo,'rin');assert.equal(s.messages[0].audience,'companions');assert.equal(s.messages[0].sceneId,s.messages[1].sceneId);
 assert.ok(s.messages[0].at<=Date.now());assert.ok(s.messages[0].at>=start);
 assert.ok(housePrompt(s,{id:'next',kind:'autonomous',at:1}).includes('"to":"xia"'));
 const viewer=parseHousePlan(JSON.stringify({beats:[{actor:'rin',text:'我在。',replyTo:'user',intent:{action:'wave'}}]}),s,{id:'user',kind:'pat',actor:'rin',at:1},origin);
 assert.equal(viewer.beats[0].replyTo,undefined);assert.equal(viewer.beats[0].audience,'user');
});

test('playful rivals appear after attention and only actual rival speech consumes cooldown',async t=>{
 let clock=Date.now();t.mock.method(Date,'now',()=>clock);
 const s=live();const seen:boolean[]=[];
 const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>{seen.push(!!event.playfulRivalry);return parseHousePlan(JSON.stringify({beats:[
  {actor:'rin',text:'很高兴你选我。',audience:'user',intent:{action:'shy'}},
  ...(event.playfulRivalry?[{actor:'xia',text:'我也想一起嘛。',audience:'user',intent:{action:'wave'}}]:[]),
 ]}),state,event,origin);});
 await e.dispatch({type:'praise',id:'rin'});assert.equal(seen[0],true);
 await e.dispatch({type:'stop'});clock+=2000;await e.dispatch({type:'praise',id:'rin'});assert.equal(seen[1],true,'cancelled before rival spoke: no cooldown');
 e.tick(Date.now()+5000);assert.ok(s.messages.some(m=>m.speaker==='xia'&&m.audience==='user'));assert.equal(s.cgSession,undefined);
 await e.dispatch({type:'stop'});clock+=2000;await e.dispatch({type:'praise',id:'rin'});assert.equal(seen[2],false);
 s.settings.playfulRivalry=false;assert.equal(restoreState(s).settings.playfulRivalry,false);
});

test('the rivalry setting changes generation before any cooldown has been used',async()=>{
 const s=live();const seen:boolean[]=[];
 const e=new GardenEngine(s,()=>{},undefined,0,async(state,event)=>{seen.push(!!event.playfulRivalry);return parseHousePlan(JSON.stringify({beats:[{actor:'rin',text:'谢谢你。',audience:'user',intent:{action:'shy'}}]}),state,event,origin);});
 await e.dispatch({type:'settings',patch:{playfulRivalry:false}});assert.equal(s.settings.playfulRivalry,false);
 await e.dispatch({type:'praise',id:'rin'});assert.deepEqual(seen,[false]);assert.equal(restoreState(s).settings.playfulRivalry,false);
});

test('fixed user interactions ignore redundant model focus labels without losing real speech',()=>{
 const s=live();const plan=parseHousePlan(JSON.stringify({focus:'user-attention',playMode:'unchanged',beats:[{actor:'rin',text:'谢谢你。',audience:'USER',intent:{action:'shy'}}]}),s,{id:'praise',kind:'praise',actor:'rin',at:1},origin);
 assert.equal(plan.focus,'user');assert.equal(plan.playMode,undefined);assert.equal(plan.beats[0].text,'谢谢你。');assert.equal(plan.beats[0].audience,'user');
});

test('a rival talking only to the favored resident does not count as asking the user for attention',()=>{
 const s=live(),event={id:'attention',kind:'praise',actor:'rin' as const,at:1,playfulRivalry:true};
 const beats=[{actor:'rin',text:'我很开心。',audience:'user',intent:{action:'shy'}},{actor:'xia',text:'你笑得真开心呀。',audience:'companions',replyTo:'rin',intent:{action:'wave'}}];
 const aside=parseHousePlan(JSON.stringify({beats}),s,event,origin);assert.equal(needsHousePartner(s,event,aside),true);
 const invite=parseHousePlan(JSON.stringify({beats:[beats[0],{actor:'xia',text:'我也想一起玩嘛。',audience:'user',intent:{action:'wave'}}]}),s,event,origin);
 assert.equal(needsHousePartner(s,event,invite),false);
});
