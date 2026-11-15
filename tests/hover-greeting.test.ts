import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine';
import {initialState} from '../src/shared/director';
import {parseHousePlan,type HouseGenerate} from '../src/shared/house-events';

const origin={backend:'model' as const,provider:'fixture',model:'fixture'};
function fixture(){const s=initialState();s.settings.mode='api';s.settings.autonomous=false;s.room.autonomous=false;s.presentIds=['xia','rin','shiori'];s.messages=[];return s;}
function generator(seen:string[]):HouseGenerate{return async(state,event)=>{seen.push(event.actor!);return parseHousePlan(JSON.stringify({beats:[{actor:event.actor,text:'我注意到你了。',intent:{action:'wave',emotion:'happy'}}]}),state,event,origin);};}

test('GPT pointer attention works with autonomous chatter disabled and accepted greetings are throttled',async()=>{
 const seen:string[]=[],e=new GardenEngine(fixture(),()=>{},undefined,0,generator(seen));
 await e.dispatch({type:'hover',id:'shiori'});
 assert.deepEqual(seen,['shiori']);assert.equal(e.state.messages[0].origin?.backend,'model');
 e.stop();await e.dispatch({type:'hover',id:'shiori'});assert.equal(seen.length,1);
});

test('busy/queued/CG-blocked hovers do not burn the later idle greeting cooldown',async()=>{
 for(const blocked of ['busy','queue','cg'] as const){
  const s=fixture(),seen:string[]=[],e=new GardenEngine(s,()=>{},undefined,0,generator(seen));
  if(blocked==='busy')s.busy=true;
  if(blocked==='queue')await e.dispatch({type:'companion-story',id:'seat-share',favored:'xia'});
  if(blocked==='cg')s.cgSession={id:'fixture'} as any;
  const before=seen.length;await e.dispatch({type:'hover',id:'shiori'});assert.equal(seen.length,before);
  e.stop();s.cgSession=undefined;
  await e.dispatch({type:'hover',id:'shiori'});assert.equal(seen.at(-1),'shiori');
 }
});

test('failed hover generations can be retried without a false 90 second lockout',async()=>{
 let calls=0;const s=fixture(),seen:string[]=[],good=generator(seen);
 const e=new GardenEngine(s,()=>{},undefined,0,async(...args)=>{if(++calls===1)throw Error('fixture network failure');return good(...args);});
 await e.dispatch({type:'hover',id:'shiori'});await e.dispatch({type:'hover',id:'shiori'});
 assert.equal(calls,2);assert.ok(e.state.messages.some(m=>m.speaker==='shiori'&&m.origin?.backend==='model'));
});

test('muted, absent, DND and focus residents do not initiate hover speech',async()=>{
 for(const condition of ['muted','absent','dnd','focus'] as const){
  const s=fixture(),seen:string[]=[];
  if(condition==='muted')s.muted=['shiori'];if(condition==='absent')s.presentIds=['xia','rin'];
  if(condition==='dnd')s.settings.dnd=true;if(condition==='focus')s.focus={id:'focus',owner:'xia',endAt:Date.now()+60000,minutes:1};
  const e=new GardenEngine(s,()=>{},undefined,0,generator(seen));await e.dispatch({type:'hover',id:'shiori'});assert.deepEqual(seen,[]);
 }
});
