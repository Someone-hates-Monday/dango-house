import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine';
import {initialState} from '../src/shared/director';
import {residentPosition} from '../src/shared/world';
import {houseOverlap,projectHouse,houseScale} from '../src/shared/house-navigation';
import {parseHousePlan,needsHousePartner,type HouseGenerate} from '../src/shared/house-events';
import {characters} from '../src/shared/characters';

function house(generate?:HouseGenerate){const s=initialState();s.presentIds=['xia','rin','shiori'];s.presentation.surface='house';s.settings.model='fixture';s.settings.autonomous=false;s.room.autonomous=false;s.room.wandering=false;const e=new GardenEngine(s,()=>{},undefined,0,generate);e.setHouseGeometry(500,400);return e;}
test('purposeful approach works without wandering, follows a safe route and stays at its destination',()=>{
 const e=house(),g={width:500,height:400,count:3},now=Date.now(),start=residentPosition(e.state.room.residents.rin,now);
 e.perform('rin',{action:'approach',target:'xia',duration:2},'local',now);
 const r=e.state.room.residents.rin;assert.ok(r.arrivesAt>now);assert.ok(r.path&&r.path.length>=2);
 for(let t=now;t<=r.arrivesAt;t+=30){const p=projectHouse(residentPosition(r,t),g);for(const id of ['xia','shiori'] as const)assert.ok(houseOverlap(p,projectHouse(residentPosition(e.state.room.residents[id],t),g),g)<=.5);assert.ok(p.y>=128*houseScale(g));}
 assert.ok(Math.hypot(r.x-start.x,r.y-start.y)>2);const end={x:r.x,y:r.y};e.tick(r.arrivesAt+1);assert.deepEqual(residentPosition(r,r.arrivesAt+100),end);assert.ok(!e.state.bodies.rin.pose.startsWith('walk'));
 // Already close: do not loop a walk clip while staying in the same position.
 e.perform('rin',{action:'approach',target:'xia'},'local',Date.now()+10000);assert.equal(e.state.room.residents.rin.arrivesAt,0);assert.ok(!e.state.bodies.rin.pose.startsWith('walk'));
});
test('a gathering moves both residents before speech and cancelled travel never emits late dialogue',async()=>{
 for(const cancel of [false,true]){
  const origin={backend:'model' as const,provider:'deepseek',model:'fixture'};
  const e=house(async(state,event)=>parseHousePlan(JSON.stringify({gather:{actors:['xia','rin'],target:'window'},beats:[{actor:'xia',text:'窗边的位置留给你。',intent:{action:'idle',duration:2}},{actor:'rin',text:'我带着书过来了。',replyTo:'xia',intent:{action:'read',duration:2}}]}),state,event,origin));e.state.settings.mode='api';
  await e.dispatch({type:'send',text:'一起到窗边聊聊。'});
  assert.ok(e.state.room.residents.xia.arrivesAt>0);assert.ok(e.state.room.residents.rin.arrivesAt>0);
  assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,0,'no arrival claim while still walking');
  if(cancel){await e.dispatch({type:'stop'});const p=residentPosition(e.state.room.residents.rin);e.tick(Date.now()+30000);assert.deepEqual(residentPosition(e.state.room.residents.rin),p);assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,0);assert.equal(e.state.companionEvents.length,0);}
  else{const at=Math.max(e.state.room.residents.xia.arrivesAt,e.state.room.residents.rin.arrivesAt);e.tick(at+300);assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,1);e.tick(at+5000);assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,2);e.tick(at+10000);assert.equal(e.state.companionEvents.length,1);}
 }
});
test('a reply that approaches its speaker is logged on arrival and cannot replace an autonomous scene',async()=>{
 let event:any;const e=house(async(state,ev)=>{event=ev;return parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'过来坐呀。',intent:{action:'idle'}},{actor:'rin',text:'好，我到你旁边。',replyTo:'xia',intent:{action:'shy'}}]}),state,ev,{backend:'model',provider:'deepseek',model:'fixture'});});e.state.settings.mode='api';
 await e.dispatch({type:'social-scene',id:'bookmark'});await new Promise(resolve=>setTimeout(resolve,0));const before=e.state.messages.filter(m=>m.origin?.backend==='model').length;
 e.tick(Date.now()+3500);assert.equal(e.state.messages.filter(m=>m.origin?.backend==='model').length,before);const arrival=e.state.room.residents.rin.arrivesAt;assert.ok(arrival>0);
 e.tick(arrival+1);assert.ok(e.state.messages.some(m=>m.speaker==='rin'&&m.origin?.backend==='model'));assert.equal(event.kind,'autonomous');
});
test('three/seven residents retain less than half overlap while sharing destinations at compact and large sizes',()=>{
 for(const count of [3,7])for(const [width,height]of count===3?[[320,280],[360,300],[500,400],[760,520]]:[[420,370],[600,450]]){
  const s=initialState();s.presentIds=characters.slice(0,count).map(c=>c.id);s.presentation.surface='house';s.room.wandering=false;s.settings.autonomous=false;s.room.autonomous=false;
  const e=new GardenEngine(s);e.setHouseGeometry(width,height);const now=Date.now(),g={width,height,count};
  for(const id of s.presentIds)e.perform(id,{action:'approach',target:'window',duration:2},'local',now);
  const end=Math.max(...s.presentIds.map(id=>s.room.residents[id].arrivesAt));
  for(let t=now;t<=end;t+=40){const points=s.presentIds.map(id=>projectHouse(residentPosition(s.room.residents[id],t),g));for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++)assert.ok(houseOverlap(points[a],points[b],g)<=.5,`${count} residents ${width}x${height}`);}
 }
});
test('observers stay put, malformed walk plans request bounded repair, and disabled tools prevent implicit motion',async()=>{
 const event={id:'movement',at:1,kind:'message',text:'一起走到窗边'},origin={backend:'model' as const,provider:'deepseek',model:'fixture'};
 const e=house(async(state,ev)=>parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'这里不错。',intent:{action:'idle'}},{actor:'rin',text:'我坐你旁边。',replyTo:'xia',intent:{action:'shy'}}]}),state,ev,origin));
 const observer=parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'我在这等着。',stay:true,intent:{action:'walk',target:'window'}}]}),e.state,event,origin);assert.equal(observer.beats[0].intent.action,'idle');assert.equal(observer.beats[0].intent.target,undefined);
 const bad=parseHousePlan(JSON.stringify({beats:[{actor:'xia',text:'走吧。',intent:{action:'walk'}},{actor:'rin',text:'好呀。',intent:{action:'idle'}}]}),e.state,event,origin);assert.equal(needsHousePartner(e.state,event,bad),true);
 e.state.settings.mode='api';e.state.connections[e.state.settings.provider].tools=false;await e.dispatch({type:'send',text:'聊聊吧'});e.tick(Date.now()+4000);assert.ok(e.state.presentIds.every(id=>e.state.room.residents[id].arrivesAt===0));
});
