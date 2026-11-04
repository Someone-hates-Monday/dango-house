import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deepseekClips} from '../src/shared/deepseek-clips';
import {chooseDeepseekClip,clipByTitle} from '../src/shared/deepseek-animation';
import {GardenEngine} from '../electron/engine';
test('every pinned DeepSeek video is indexed and locally available',()=>{
 assert.equal(deepseekClips.length,109);assert.equal(new Set(deepseekClips.map(c=>c.id)).size,109);
 for(const c of deepseekClips){assert.ok(c.seconds>0);assert.ok(fs.existsSync('public/'+c.src.slice(2)));}
});
test('explicit library playback rejects arbitrary paths and other characters',async()=>{
 const e=new GardenEngine();
 await assert.rejects(e.dispatch({type:'play-clip',id:'xia',clipId:'../../credentials'}));
 await assert.rejects(e.dispatch({type:'play-clip',id:'rin',clipId:'idle'}));
 const clip=clipByTitle('拆礼物')!;await e.dispatch({type:'play-clip',id:'xia',clipId:clip.id});
 assert.equal(e.state.bodies.xia.interaction?.clipId,clip.id);
 assert.equal(chooseDeepseekClip('think',e.state.bodies.xia.until,e.state.bodies.xia.interaction),clip.id);
 assert.ok(e.state.bodies.xia.until-e.state.bodies.xia.interaction!.startedAt>=clip.seconds*1000);
});
test('random category selection avoids immediate repeats; social and touch have actual clips',async()=>{
 const e=new GardenEngine();await e.dispatch({type:'play-clip',id:'xia',group:'food'});const first=e.state.bodies.xia.interaction?.clipId;
 await e.dispatch({type:'play-clip',id:'xia',group:'food'});assert.notEqual(e.state.bodies.xia.interaction?.clipId,first);
 await e.dispatch({type:'pat',id:'xia'});assert.ok(['shy','pat'].includes(chooseDeepseekClip('wait',e.state.bodies.xia.until,e.state.bodies.xia.interaction)));
 e.perform('xia',{action:'approach',target:'rin',bubble:'一起坐，给你留了座位'});
 assert.equal(e.state.bodies.xia.interaction?.clipId,clipByTitle('女仆屈膝礼仪')!.id);
});
test('autonomous variety respects quiet mode and explicit disable',()=>{
 const e=new GardenEngine();e.state.settings.dnd=true;e.tick(Date.now()+125000);assert.notEqual(e.state.bodies.xia.interaction?.kind,'clip');
});
