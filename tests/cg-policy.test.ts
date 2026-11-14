import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';
import {initialState,restoreState} from '../src/shared/director';
import {allowsEventCg} from '../src/shared/cg-policy';
import {GardenEngine} from '../electron/engine';
import {idleVideos} from '../src/reaction-pack';

test('pair affection and user romance are independent; quiet mode stops event clips',()=>{
 const s=initialState();s.relationship.mode='friend';
 assert.equal(allowsEventCg(s,'gpt-close-t1'),false);
 assert.equal(allowsEventCg(s,'rin-xia-cheek-t1'),true);
 s.relationship.mode='romance';s.settings.pairRomance=false;
 assert.equal(allowsEventCg(s,'gpt-close-t1'),true);
 assert.equal(allowsEventCg(s,'rin-xia-cheek-t1'),false);
 s.settings.cgAutoplay=false;assert.equal(allowsEventCg(s,'gpt-close-t1'),false);
 const restored=restoreState(s);assert.equal(restored.settings.pairRomance,false);assert.equal(restored.settings.cgAutoplay,false);
});
test('praise leads to a delayed invitation only in romance mode',async()=>{
 for(const mode of ['friend','romance'] as const){
  const s=initialState();s.relationship.mode=mode;s.settings.autonomous=false;s.room.autonomous=false;
  const e=new GardenEngine(s,()=>{},undefined,0);
  await e.dispatch({type:'praise',id:'rin'});
  assert.equal(e.state.cgSession==null,true);
  const start=Date.now();for(let t=start;t<start+45000;t+=400)e.tick(t);
  assert.equal(e.state.cgSession?.asset,mode==='romance'?'xia-reach-t1':undefined);
 }
});
test('disabled pair intimacy does not schedule a yuri scene',async()=>{
 const s=initialState();s.settings.pairRomance=false;s.settings.autonomous=false;s.room.autonomous=false;
 const e=new GardenEngine(s);await e.dispatch({type:'yuri-scene',id:'rin-xia-seat'});
 const start=Date.now();for(let t=start;t<start+45000;t+=400)e.tick(t);
 assert.equal(e.state.cgSession,undefined);assert.equal(e.state.companionEvents.length,0);
});
test('turning event clips off cancels pending invitations and active automatic playback',async()=>{
 for(const active of [false,true]){
  const s=initialState();s.relationship.mode='romance';s.settings.autonomous=false;s.room.autonomous=false;
  const e=new GardenEngine(s,()=>{},undefined,0);await e.dispatch({type:'praise',id:'rin'});
  const start=Date.now();if(active)for(let t=start;t<start+20000;t+=400)e.tick(t);
  if(active)assert.ok(e.state.cgSession?.automatic);
  await e.dispatch({type:'settings',patch:{cgAutoplay:false}});
  const messages=e.state.messages.length;
  for(let t=start+20000;t<start+40000;t+=400)e.tick(t);
  assert.equal(e.state.cgSession,undefined);assert.equal(e.state.messages.length,messages);
  if(active)assert.equal(e.state.cgLastReceipt?.outcome,'cancelled');
 }
});
test('GPT idle is the historical reviewed bytes and alternate candidates are not published',()=>{
 const p='public/'+idleVideos.gpt.replace(/^\.\//,'');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),'57fb864e8f6b9ac6ec6ab447da8f6cc992f6c6f94399f6fa282dd05b177bda19');
 assert.deepEqual(fs.readdirSync('public/video/gpt').filter(f=>f.endsWith('.webm')).sort(),['idle-reviewed-oct29-v2.webm','pat-pixverse-p1.webm']);
});
