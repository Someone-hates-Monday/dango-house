import test from 'node:test';import assert from 'node:assert/strict';
import {claudeInteractionClip} from '../src/shared/claude-animation.ts';
import {GardenEngine} from '../electron/engine.ts';
test('Claude distinguishes affection, petting, chat, rice and quiet book gestures',()=>{
 const now=100000;
 for(const kind of ['pat','affection','chat','bookmark'] as const)assert.equal(claudeInteractionClip({kind,startedAt:now},now+500),kind);
 assert.equal(claudeInteractionClip({kind:'feed',food:'rice',startedAt:now},now),'rice');
 for(const food of ['tea','cake','fish'] as const)assert.equal(claudeInteractionClip({kind:'feed',food,startedAt:now},now),'idle');
 assert.equal(claudeInteractionClip({kind:'pat',startedAt:now},now+11000),'idle');
 assert.equal(claudeInteractionClip({kind:'pat',startedAt:now},now-1),'idle');
});
test('private selection and praise emit distinct reactions',async()=>{
 const e=new GardenEngine(undefined,undefined,undefined,0);
 await e.dispatch({type:'private-open',id:'rin'});assert.equal(e.state.bodies.rin.interaction?.kind,'chat');
 await e.dispatch({type:'praise',id:'rin'});assert.equal(e.state.bodies.rin.interaction?.kind,'affection');
});
test('rare book gesture has a cooldown and respects quiet mode and active touches',()=>{
 const e=new GardenEngine();e.state.room.autonomous=true;e.state.settings.autonomous=true;e.state.room.wandering=false;
 const future=Date.now()+100000;e.tick(future);assert.equal(e.state.bodies.rin.interaction?.kind,'bookmark');
 const cue=e.state.bodies.rin.interaction?.startedAt;e.tick(future+1000);assert.equal(e.state.bodies.rin.interaction?.startedAt,cue);
 const q=new GardenEngine();q.state.settings.dnd=true;q.tick(future);assert.notEqual(q.state.bodies.rin.interaction?.kind,'bookmark');
 const touched=new GardenEngine();touched.perform('rin',{action:'shy',duration:7},'local',future,{kind:'pat',startedAt:future});touched.tick(future+1000);assert.equal(touched.state.bodies.rin.interaction?.kind,'pat');
});
