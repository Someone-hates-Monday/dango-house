import test from 'node:test';import assert from 'node:assert/strict';
import {claudeInteractionClip,claudePoseClip,claudeReactionClip,claudeWalkClip,claudeWalkOppositeClip,socialClaudeClip} from '../src/shared/claude-animation.ts';
import {GardenEngine} from '../electron/engine.ts';
test('Claude distinguishes affection, petting, chat, rice and quiet book gestures',()=>{
 const now=100000;
 assert.equal(claudeInteractionClip({kind:'pat',startedAt:now},now+500),'pat');
 assert.equal(claudeInteractionClip({kind:'affection',startedAt:now},now+500),'affection');
 assert.equal(claudeInteractionClip({kind:'chat',startedAt:now},now+500),'chat');
 assert.equal(claudeInteractionClip({kind:'bookmark',startedAt:now},now+500),'bookmark');
 assert.equal(claudeInteractionClip({kind:'feed',food:'rice',startedAt:now},now),'rice');
 assert.equal(claudeInteractionClip({kind:'feed',food:'fish',startedAt:now},now),'fishShy');
 assert.equal(claudeInteractionClip({kind:'feed',food:'cake',startedAt:now},now),'affection');
 assert.equal(claudeInteractionClip({kind:'feed',food:'tea',startedAt:now},now),'chat');
 assert.equal(claudeInteractionClip({kind:'pat',startedAt:now},now+11000),'idle');
 assert.equal(claudeInteractionClip({kind:'pat',startedAt:now},now-1),'idle');
 assert.equal(claudeInteractionClip({kind:'clip',clipId:'gptJoke',startedAt:now},now),'gptJoke');
});
test('Claude walk poses map left→walk, right→walkOpposite with loop windows',()=>{
 assert.equal(claudePoseClip('walk-left'),'walk');
 assert.equal(claudePoseClip('walk-right'),'walkOpposite');
 assert.equal(claudePoseClip('think'),'thinking');
 assert.equal(claudePoseClip('sad'),'rivalrySoft');
 assert.equal(claudePoseClip('wait'),'hesitate');
 assert.equal(claudePoseClip('jump'),'success');
 assert.equal(claudePoseClip('wave'),'chat');
 assert.ok(claudeWalkClip.loopStart<claudeWalkClip.loopEnd);
 assert.ok(claudeWalkClip.loopEnd<=claudeWalkClip.exitEnd);
 assert.ok(claudeWalkOppositeClip.loopStart<claudeWalkOppositeClip.loopEnd);
 assert.ok(claudeWalkOppositeClip.loopEnd<=claudeWalkOppositeClip.exitEnd);
});
test('Claude social routing picks sleep and comfort clips from bubble or action',()=>{
 assert.equal(socialClaudeClip('sleep','晚安'),'goodnight');
 assert.equal(socialClaudeClip('wave','给你安慰一下'),'reassure');
 assert.equal(socialClaudeClip('wave',''),'chat');
 assert.equal(socialClaudeClip('shy',''),'hesitate');
 assert.equal(socialClaudeClip('think',''),'thinking');
 assert.equal(socialClaudeClip('read',''),'bookmark');
 assert.equal(socialClaudeClip('sit',''),'bookmark');
 assert.equal(socialClaudeClip('water',''),'chat');
 assert.equal(socialClaudeClip('eat',''),'rice');
});
test('Claude reaction falls back to pose when interaction has no clip',()=>{
 const now=100000;
 assert.equal(claudeReactionClip('wave',undefined,now),'chat');
 assert.equal(claudeReactionClip('wait',{kind:'pat',startedAt:now},now),'pat');
 assert.equal(claudeReactionClip('jump',{kind:'feed',food:'tea',startedAt:now},now),'chat');
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
test('rin perform without interaction attaches a Claude social clip when action matches',()=>{
 const e=new GardenEngine();
 const now=Date.now();
 e.perform('rin',{action:'think',duration:5},'local',now);
 assert.equal(e.state.bodies.rin.interaction?.kind,'clip');
 assert.equal(e.state.bodies.rin.interaction?.clipId,'thinking');
 e.perform('rin',{action:'wave',duration:5},'local',now+1);
 assert.equal(e.state.bodies.rin.interaction?.clipId,'chat');
});
test('rin play-clip loads a catalogued Claude clip',async()=>{
 const e=new GardenEngine();
 await e.dispatch({type:'play-clip',id:'rin',clipId:'reassure'});
 assert.equal(e.state.bodies.rin.interaction?.kind,'clip');
 assert.equal(e.state.bodies.rin.interaction?.clipId,'reassure');
});
test('rin play-clip walk and walkOpposite preview without travel pose',async()=>{
 const e=new GardenEngine();
 await e.dispatch({type:'play-clip',id:'rin',clipId:'walk'});
 assert.equal(e.state.bodies.rin.interaction?.clipId,'walk');
 assert.equal(e.state.bodies.rin.pose,'think');
 assert.equal(e.state.room.residents.rin.arrivesAt,0);
 await e.dispatch({type:'play-clip',id:'rin',clipId:'walkOpposite'});
 assert.equal(e.state.bodies.rin.interaction?.clipId,'walkOpposite');
 assert.equal(e.state.bodies.rin.pose,'think');
});
test('Claude trip maps to soft rivalry clip',()=>{
 const now=100000;
 assert.equal(claudeInteractionClip({kind:'trip',startedAt:now},now+500),'rivalrySoft');
});
