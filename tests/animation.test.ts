import test from 'node:test';
import assert from 'node:assert/strict';
import {animationFrames,frameViewBox,playbackIndex} from '../src/shared/animation.ts';
import type {Pose} from '../src/shared/types.ts';

test('known damaged source cells never enter the animation loops',()=>{
  const forbidden:Record<string,[number,number][]>= {claude:[...[0,1,2,3,4,5].map(c=>[6,c] as [number,number]),[7,4],[7,5],...[0,1,2,3,4,5].map(c=>[8,c] as [number,number])],grok:[[6,0],[6,1],[6,2],[6,3],[6,4],[7,3]],deepseek:[[2,0],[2,4],[2,5],[2,6]],gpt:[[2,6],[2,7]],kimi:[[2,0],[7,4]]};
  const poses:Pose[]=['idle','walk-left','walk-right','wave','jump','sad','wait','think','read'];
  for(const[file,bad]of Object.entries(forbidden))for(const pose of poses)for(const f of animationFrames(file,pose))assert.equal(bad.some(([r,c])=>f.row===r&&f.column===c),false,`${file}/${pose} includes damaged cell ${f.row}:${f.column}`);
  for(const file of [...Object.keys(forbidden),'gemini'])for(const pose of poses){const frames=animationFrames(file,pose);assert.ok(frames.length>1,`${file}/${pose} remains animated`);for(const f of frames){assert.ok(f.row>=0&&f.row<9&&f.column>=0&&f.column<8);const[x,y,w,h]=frameViewBox(f).split(' ').map(Number);assert.equal(x%(f.cellWidth??192),0);assert.equal(y%(f.cellHeight??208),0);assert.equal(w,f.cellWidth??192);assert.equal(h,f.cellHeight??208);}}
});

test('idle holds for seconds and gestures settle after a single performance',()=>{
  for(const file of ['claude','grok','deepseek','gpt','gemini','kimi']){
    const count=animationFrames(file,'idle').length;
    for(const elapsed of [0,1000,5000,10000,11000,12000])assert.equal(playbackIndex(file,'idle',elapsed,count),0);
    for(const pose of ['wave','jump','sad','wait','think','read'] as Pose[]){const n=animationFrames(file,pose).length;assert.equal(playbackIndex(file,pose,5000,n),0);assert.equal(playbackIndex(file,pose,12000,n),0);}
  }
  assert.notEqual(playbackIndex('grok','walk-right',360,8),playbackIndex('grok','walk-right',720,8));
});
