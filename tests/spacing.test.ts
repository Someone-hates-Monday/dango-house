import test from 'node:test';
import assert from 'node:assert/strict';
import {separateCast,overlapFraction,coveredFraction,type CastBox} from '../src/shared/spacing.ts';
const check=(placed:Record<string,CastBox>)=>{const list=Object.values(placed);for(let i=0;i<list.length;i++){assert.ok(coveredFraction(list[i],list.filter((_,j)=>j!==i))<=.500001,`total coverage ${list[i].id}`);for(let j=i+1;j<list.length;j++)assert.ok(overlapFraction(list[i],list[j])<=.500001,`${list[i].id}/${list[j].id} overlap ${overlapFraction(list[i],list[j])}`);}};
test('seven residents meeting at one point can overlap partially but never by more than half',()=>{
  for(const x of [50,400,750])for(const y of [150,280,400]){const cast=Array.from({length:7},(_,i)=>({id:String(i),x,y,width:90,height:135}));const placed=separateCast(cast,{left:45,right:755,top:140,bottom:420});check(placed);assert.ok(Object.values(placed).every(p=>p.x>=45&&p.x<=755&&p.y>=140&&p.y<=420));}
});
test('desktop approaching and dragging pass through a crowded location without excessive coverage',()=>{
  for(let t=0;t<=1;t+=.05){const cast=Array.from({length:7},(_,i)=>({id:String(i),x:i===6?80+1000*t:500+i*15,y:650,width:140,height:166}));check(separateCast(cast,{left:80,right:1200,top:180,bottom:720}));}
});
test('unobstructed positions are stable and half overlap remains permitted',()=>{
  const cast=[{id:'a',x:200,y:200,width:100,height:100},{id:'b',x:250,y:200,width:100,height:100}];const p=separateCast(cast,{left:50,right:700,top:100,bottom:500});assert.equal(p.a.x,200);assert.equal(p.b.x,250);assert.equal(overlapFraction(p.a,p.b),.5);
});
test('two neighbours cannot each hide a different half of the same girl',()=>{
  const cast=[{id:'a',x:200,y:200,width:100,height:100},{id:'b',x:150,y:200,width:100,height:100},{id:'c',x:250,y:200,width:100,height:100}];check(separateCast(cast,{left:50,right:700,top:100,bottom:500}));
});
