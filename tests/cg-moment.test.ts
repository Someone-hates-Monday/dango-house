import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine.ts';
import {initialState,restoreState} from '../src/shared/director.ts';
import type {CgAssetId} from '../src/shared/types.ts';

/** Pair clips meet+talk first; advance the director until overhead session starts. */
function settleCg(engine:GardenEngine,start=Date.now()){
  if(engine.state.cgSession)return engine.state.cgSession;
  for(let t=start;t<start+45_000;t+=400){
    engine.tick(t);
    if(engine.state.cgSession)return engine.state.cgSession;
  }
  return undefined;
}

async function preview(engine:GardenEngine,host:'room'|'desktop',asset?:CgAssetId){
  await engine.dispatch(asset?{type:'cg-preview',host,asset}:{type:'cg-preview',host});
  return settleCg(engine);
}

test('manual CG preview can select an installed clip without rewarding it',async()=>{
 const engine=new GardenEngine(initialState());
 const bonds={...engine.state.bonds};
 assert.ok(await preview(engine,'room','rin-xia-share-bowl-t1'));
 assert.equal(engine.state.cgSession?.asset,'rin-xia-share-bowl-t1');
 assert.equal(engine.state.cgSession?.segmentId,'rin-xia-share-bowl-t1-main');
 await engine.dispatch({type:'cg-complete',sessionId:engine.state.cgSession!.id,outcome:'ended'});
 assert.deepEqual(engine.state.bonds,bonds);
 assert.ok(await preview(engine,'room','rin-xia-welcome-t1'));
 assert.equal(engine.state.cgSession?.asset,'rin-xia-welcome-t1');
 assert.equal(engine.state.cgSession?.segmentId,'rin-xia-welcome-t1-main');
 await engine.dispatch({type:'cg-complete',sessionId:engine.state.cgSession!.id,outcome:'ended'});
 assert.deepEqual(engine.state.bonds,bonds);
 assert.ok(await preview(engine,'room','rin-xia-fish-leads-t2'));
 assert.equal(engine.state.cgSession?.asset,'rin-xia-fish-leads-t2');
 assert.equal(engine.state.cgSession?.segmentId,'rin-xia-fish-leads-t2-main');
 await engine.dispatch({type:'cg-complete',sessionId:engine.state.cgSession!.id,outcome:'ended'});
 assert.deepEqual(engine.state.bonds,bonds);
 assert.ok(await preview(engine,'room'));
 assert.equal(engine.state.cgSession?.asset,'rin-xia-hair-v1');
});

test('solo clips speak before playback and require only the actual performer',async()=>{
 const engine=new GardenEngine(initialState());
 await engine.dispatch({type:'cast-present',id:'xia',present:false});
 await engine.dispatch({type:'cg-preview',host:'room',asset:'xia-reach-t1'});
 assert.equal(engine.state.cgSession==null,true,'do not abruptly open before the spoken invitation');
 settleCg(engine);
 assert.equal(engine.state.cgSession?.asset,'xia-reach-t1');
 await engine.dispatch({type:'cg-dismiss',sessionId:engine.state.cgSession!.id});
 await engine.dispatch({type:'cast-present',id:'shiori',present:true});
 await engine.dispatch({type:'cg-preview',host:'room',asset:'gpt-close-t1'});
 settleCg(engine);
 assert.equal(engine.state.cgSession?.asset,'gpt-close-t1');
 await engine.dispatch({type:'cast-present',id:'shiori',present:false});
 engine.tick();
 assert.equal(engine.state.cgSession,undefined);
});

test('manual CG has one host and stale callbacks cannot close a newer session',async()=>{
 const engine=new GardenEngine(initialState());const bonds={...engine.state.bonds};
 const first=await preview(engine,'room');assert.ok(first);
 assert.equal(first!.outcome,'playing');assert.ok(first!.jobId&&first!.segmentId);
 const second=await preview(engine,'desktop');assert.ok(second);
 // Second preview queues intro while first may still play — dismiss first if still live.
 if(engine.state.cgSession?.id===first!.id)await engine.dispatch({type:'cg-dismiss',sessionId:first!.id});
 const live=settleCg(engine)??engine.state.cgSession;
 assert.ok(live);
 assert.equal(live!.host,'desktop');
 await engine.dispatch({type:'cg-dismiss',sessionId:first!.id});
 assert.equal(engine.state.cgSession?.id,live!.id);
 assert.deepEqual(engine.state.bonds,bonds);assert.equal(engine.state.companionEvents.length,0);
 await engine.dispatch({type:'cg-dismiss',sessionId:live!.id});assert.equal(engine.state.cgSession,undefined);
 assert.equal(engine.state.cgLastReceipt?.outcome,'cancelled');
 assert.equal(engine.state.cgLastReceipt?.sessionId,live!.id);
 assert.deepEqual(engine.state.bonds,bonds);assert.equal(engine.state.companionEvents.length,0);
});

test('CG respects presence, DND, expiry and restore without replay',async()=>{
 const engine=new GardenEngine(initialState());
 assert.ok(await preview(engine,'room'));
 assert.equal(restoreState(engine.state).cgSession,undefined);
 engine.tick(engine.state.cgSession!.expiresAt+1);assert.equal(engine.state.cgSession,undefined);
 assert.equal(engine.state.cgLastReceipt?.outcome,'cancelled');
 assert.ok(await preview(engine,'desktop'));
 await engine.dispatch({type:'settings',patch:{dnd:true}});engine.tick();assert.equal(engine.state.cgSession,undefined);
 await engine.dispatch({type:'cg-preview',host:'room'});assert.equal(engine.state.cgSession,undefined);
 await engine.dispatch({type:'settings',patch:{dnd:false}});
 await engine.dispatch({type:'cast-present',id:'rin',present:false});
 await engine.dispatch({type:'cg-preview',host:'room'});assert.equal(engine.state.cgSession,undefined);
});

test('stop dismisses the complete CG session as cancelled',async()=>{
 const engine=new GardenEngine(initialState());
 assert.ok(await preview(engine,'room'));
 const id=engine.state.cgSession!.id;
 await engine.dispatch({type:'stop'});assert.equal(engine.state.cgSession,undefined);
 assert.equal(engine.state.cgLastReceipt?.sessionId,id);
 assert.equal(engine.state.cgLastReceipt?.outcome,'cancelled');
 assert.equal(engine.state.companionEvents.length,0);
});

test('real ended and failed receipts never grant bond or companion events',async()=>{
 const engine=new GardenEngine(initialState());
 const bonds={...engine.state.bonds};
 assert.ok(await preview(engine,'room'));
 const id=engine.state.cgSession!.id;
 await engine.dispatch({type:'cg-complete',sessionId:id,outcome:'ended'});
 assert.equal(engine.state.cgSession == null,true);
 assert.equal(engine.state.cgLastReceipt?.outcome,'ended');
 assert.equal(engine.state.cgLastReceipt?.sessionId,id);
 assert.deepEqual(engine.state.bonds,bonds);
 assert.equal(engine.state.companionEvents.length,0);

 assert.ok(await preview(engine,'room'));
 const failId=engine.state.cgSession!.id;
 await engine.dispatch({type:'cg-complete',sessionId:failId,outcome:'failed'});
 assert.equal(engine.state.cgLastReceipt?.outcome,'failed');
 assert.deepEqual(engine.state.bonds,bonds);
 assert.equal(engine.state.companionEvents.length,0);
});

test('stale complete cannot close a newer playing session',async()=>{
 const engine=new GardenEngine(initialState());
 assert.ok(await preview(engine,'desktop'));
 const liveSession=engine.state.cgSession!;
 assert.equal(liveSession.outcome,'playing');
 await engine.dispatch({type:'cg-complete',sessionId:'not-live',outcome:'ended'});
 assert.equal(engine.state.cgSession?.id,liveSession.id);
 assert.equal(engine.state.cgSession?.outcome,'playing');
 await engine.dispatch({type:'cg-dismiss',sessionId:liveSession.id});
 assert.equal(engine.state.cgLastReceipt?.outcome,'cancelled');
});

test('seat-share settle can trigger window-seat CG without reward from the clip',async()=>{
 const engine=new GardenEngine(initialState());
 const bondsBefore=JSON.stringify(engine.state.bonds);
 await engine.dispatch({type:'companion-story',id:'seat-share'});
 const start=Date.now();
 for(let t=start;t<start+120_000;t+=500){
  engine.tick(t);
  if(engine.state.cgSession?.asset==='rin-xia-window-seat-t1')break;
 }
 assert.equal(engine.state.cgSession?.asset,'rin-xia-window-seat-t1');
 const bondsMid={...engine.state.bonds};
 await engine.dispatch({type:'cg-complete',sessionId:engine.state.cgSession!.id,outcome:'ended'});
 assert.deepEqual(engine.state.bonds,bondsMid);
 assert.notEqual(JSON.stringify(engine.state.bonds),bondsBefore);
});
