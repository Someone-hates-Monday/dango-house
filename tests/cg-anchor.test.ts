import test from 'node:test';
import assert from 'node:assert/strict';
import {cgCardSize,fallbackStageAnchor,pairOverheadAnchor,soloOverheadAnchor,groupOverheadAnchor} from '../src/shared/cg-anchor.ts';

test('cg card size stays within host targets and shrinks with tight headroom',()=>{
  const room=cgCardSize(800,280,'room');
  assert.ok(room.width>=200&&room.width<=340);
  const desk=cgCardSize(1200,400,'desktop');
  assert.ok(desk.width>=220&&desk.width<=360);
  const tight=cgCardSize(400,130,'room');
  assert.ok(tight.width<=340);
});

test('pair overhead sits above midpoint and refuses when headroom is gone',()=>{
  const bounds={left:0,top:0,width:1000,height:600};
  const a={left:200,top:300,width:90,height:135};
  const b={left:400,top:310,width:90,height:135};
  const placed=pairOverheadAnchor(a,b,bounds,'room');
  assert.ok(placed);
  assert.ok(placed!.top+placed!.height<=Math.min(a.top,b.top)-4);
  const mid=(a.left+a.width/2+b.left+b.width/2)/2;
  assert.ok(Math.abs(placed!.left+placed!.width/2-mid)<placed!.width);
  assert.equal(pairOverheadAnchor(a,{...b,top:80},bounds,'room'),null);
});

test('forced expand falls back inside the stage when overhead is gone',()=>{
  const bounds={left:40,top:20,width:900,height:500};
  const placed=fallbackStageAnchor(bounds,'room');
  assert.ok(placed.width>=200&&placed.width<=340);
  assert.ok(placed.left>=bounds.left);
  assert.ok(placed.left+placed.width<=bounds.left+bounds.width);
  assert.equal(placed.top,bounds.top+8);
});

test('solo overhead anchors above one character',()=>{
  const bounds={left:0,top:0,width:1000,height:600};
  const a={left:420,top:320,width:90,height:135};
  const placed=soloOverheadAnchor(a,bounds,'room');
  assert.ok(placed);
  assert.ok(placed!.top+placed!.height<=a.top-4);
  assert.equal(soloOverheadAnchor({...a,top:70},bounds,'room'),null);
});
test('group playback has one shared anchor including the third participant',()=>{
 const bounds={left:0,top:0,width:1400,height:900};
 const boxes=[{left:200,top:500,width:100,height:150},{left:400,top:530,width:100,height:150},{left:1000,top:460,width:100,height:150}];
 const p=groupOverheadAnchor(boxes,bounds,'room');assert.ok(p);
 assert.ok(Math.abs(p.left+p.width/2-(250+450+1050)/3)<1);
 assert.ok(p.top+p.height<460);
 assert.equal(groupOverheadAnchor([],bounds,'room'),null);
 assert.deepEqual(groupOverheadAnchor([boxes[0]],bounds,'room'),soloOverheadAnchor(boxes[0],bounds,'room'));
});
