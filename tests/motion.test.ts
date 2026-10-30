import test from 'node:test';import assert from 'node:assert/strict';
import {actualPose,dockPosition,tripSample,walkClip} from '../src/shared/motion.ts';
import {GardenEngine} from '../electron/engine.ts';
import {restoreState} from '../src/shared/director.ts';
test('a blocked requested walk settles while resolved displacement drives other movement',()=>{
 assert.equal(actualPose('walk-right',0,0,50),'idle');assert.equal(actualPose('idle',-2,0,50),'walk-left');assert.equal(actualPose('wave',0,0,50),'wave');
});
test('dock slots are fixed, evenly spaced and remain within resized displays',()=>{
 for(const width of [640,1280,1920]){const slots=Array.from({length:7},(_,i)=>dockPosition(i,7,width,720));for(const [i,p] of slots.entries()){assert.equal(p.y,716);assert.ok(p.x-p.cell/2>=0&&p.x+p.cell/2<=width);if(i)assert.ok(Math.abs(p.x-slots[i-1].x-p.cell)<.00001);}}
});
test('ordinary running excludes fall, explicit trip holds down then recovers',()=>{
 assert.ok(walkClip.loopEnd<4.45);assert.equal(tripSample(.8).phase,'fall');assert.deepEqual(tripSample(1),tripSample(3.3));assert.equal(tripSample(3.5).phase,'recover');assert.ok(tripSample(4.5).time>tripSample(3.5).time);assert.equal(tripSample(7).phase,'settle');
});
test('dock preferences persist and preserve free pet positions; touches carry distinct metadata',async()=>{
 const e=new GardenEngine();e.state.pets.rin={x:.3,y:.8,displayId:1};const before=structuredClone(e.state.pets);
 await e.dispatch({type:'presentation',patch:{desktopMode:'dock',chatForm:'chibi'}});assert.deepEqual(e.state.pets,before);
 e.perform('rin',{action:'approach',target:'xia'});assert.equal(e.state.desktopMoves.rin,undefined);
 await e.dispatch({type:'pat',id:'rin'});assert.equal(e.state.bodies.rin.interaction?.kind,'pat');
 await e.dispatch({type:'feed',id:'rin',food:'tea'});assert.equal(e.state.bodies.rin.interaction?.food,'tea');
 const restored=restoreState(e.state);assert.equal(restored.presentation.desktopMode,'dock');assert.equal(restored.presentation.chatForm,'chibi');assert.deepEqual(restored.pets,before);
 await e.dispatch({type:'presentation',patch:{desktopMode:'free'}});assert.deepEqual(e.state.pets,before);
});
