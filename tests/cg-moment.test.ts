import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenEngine} from '../electron/engine.ts';
import {initialState,restoreState} from '../src/shared/director.ts';

test('manual CG has one host and stale callbacks cannot close a newer session',async()=>{
 const engine=new GardenEngine(initialState());const bonds={...engine.state.bonds};
 await engine.dispatch({type:'cg-preview',host:'room'});const first=engine.state.cgSession!;
 await engine.dispatch({type:'cg-preview',host:'desktop'});const second=engine.state.cgSession!;
 assert.notEqual(first.id,second.id);assert.equal(second.host,'desktop');
 await engine.dispatch({type:'cg-dismiss',sessionId:first.id});assert.equal(engine.state.cgSession?.id,second.id);
 assert.deepEqual(engine.state.bonds,bonds);assert.equal(engine.state.companionEvents.length,0);
 await engine.dispatch({type:'cg-dismiss',sessionId:second.id});assert.equal(engine.state.cgSession,undefined);
});

test('CG respects presence, DND, expiry and restore without replay',async()=>{
 const engine=new GardenEngine(initialState());
 await engine.dispatch({type:'cg-preview',host:'room'});assert.ok(engine.state.cgSession);
 assert.equal(restoreState(engine.state).cgSession,undefined);
 engine.tick(engine.state.cgSession!.expiresAt+1);assert.equal(engine.state.cgSession,undefined);
 await engine.dispatch({type:'cg-preview',host:'desktop'});
 await engine.dispatch({type:'settings',patch:{dnd:true}});engine.tick();assert.equal(engine.state.cgSession,undefined);
 await engine.dispatch({type:'cg-preview',host:'room'});assert.equal(engine.state.cgSession,undefined);
 await engine.dispatch({type:'settings',patch:{dnd:false}});
 await engine.dispatch({type:'cast-present',id:'rin',present:false});
 await engine.dispatch({type:'cg-preview',host:'room'});assert.equal(engine.state.cgSession,undefined);
});

test('stop dismisses the complete CG session',async()=>{
 const engine=new GardenEngine(initialState());await engine.dispatch({type:'cg-preview',host:'room'});
 await engine.dispatch({type:'stop'});assert.equal(engine.state.cgSession,undefined);
});
