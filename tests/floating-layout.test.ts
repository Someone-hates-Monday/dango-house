import test from 'node:test';import assert from 'node:assert/strict';
import {placeFloating,intersects} from '../src/shared/floating-layout';
test('menu moves out of speech/CG space and remains on screen',()=>{
 const b={left:8,top:8,width:884,height:584};const obstacle={left:300,top:280,width:290,height:250};
 const p=placeFloating({left:320,top:300,width:292,height:180},b,[obstacle]);assert.ok(p);assert.equal(intersects(p,obstacle),false);assert.ok(p.left>=8&&p.left+p.width<=892&&p.top>=8&&p.top+p.height<=592);
});
test('no available region reports exhaustion rather than overlapping',()=>{assert.equal(placeFloating({left:10,top:10,width:200,height:100},{left:0,top:0,width:200,height:100},[{left:0,top:0,width:200,height:100}]),null);});
