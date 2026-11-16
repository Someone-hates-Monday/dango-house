import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine';
import {initialState} from '../src/shared/director';

function state(){const s=initialState();s.settings.mode='api';s.settings.autonomous=false;s.room.autonomous=false;s.relationship.mode='romance';return s;}
test('private CG request waits for completed reply and scene, without public transcript disclosure',async()=>{
 const s=state();let receipt='';
 const e=new GardenEngine(s,()=>{},async(_s,_id,_text,_signal,_update,_act,_invite,cg)=>{receipt=cg!('xia-reach-t1');assert.equal(e.state.cgSession,undefined);return '（向你张开手）来，靠近一点。';},0);
 await e.dispatch({type:'private-send',id:'rin',text:'PRIVATE_SECRET 抱抱我'});
 assert.match(receipt,/queued/);assert.equal(e.state.cgSession,undefined);
 for(let i=0;i<8&&!e.state.cgSession;i++)e.tick(Date.now()+i*5000);
 assert.equal((e.state as ReturnType<typeof state>).cgSession?.asset,'xia-reach-t1');
 assert.ok(!e.state.messages.some(m=>m.text.includes('PRIVATE_SECRET')));
});
test('disabled CG gives visible private reason and does not start playback',async()=>{
 const s=state();s.settings.cgAutoplay=false;
 const e=new GardenEngine(s,()=>{},async(_s,_id,_text,_signal,_update,_act,_invite,cg)=>{assert.match(cg!('xia-reach-t1'),/blocked/);return '我可以陪你。';},0);
 await e.dispatch({type:'private-send',id:'rin',text:'抱抱我'});
 e.tick(Date.now()+30000);assert.equal(e.state.cgSession,undefined);
 assert.ok(e.state.privateMessages.rin.some(m=>m.speaker==='system'&&m.text.includes('剧情短片')));
});
test('cancelled private request never starts CG after delayed generation returns',async()=>{
 const s=state();let finish!:()=>void;const gate=new Promise<void>(r=>finish=r);
 const e=new GardenEngine(s,()=>{},async(_s,_id,_text,_signal,_update,_act,_invite,cg)=>{cg!('xia-reach-t1');await gate;return '过来吧。';},0);
 const turn=e.dispatch({type:'private-send',id:'rin',text:'抱抱我'});
 await new Promise(r=>setTimeout(r,20));e.stop();finish();await turn;e.tick(Date.now()+30000);
 assert.equal(e.state.cgSession,undefined);
});
test('a resident cannot request another resident or pair CG through private tool',async()=>{
 const e=new GardenEngine(state(),()=>{},async(_s,_id,_text,_signal,_update,_act,_invite,cg)=>{assert.throws(()=>cg!('gpt-close-t1'));assert.throws(()=>cg!('rin-xia-cheek-t1'));return '我在。';},0);
 await e.dispatch({type:'private-send',id:'rin',text:'陪我'});e.tick(Date.now()+30000);assert.equal(e.state.cgSession,undefined);
});
