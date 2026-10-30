import {chromium} from 'playwright';
import {GardenEngine} from '../electron/engine.ts';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='test-results/rig-bounds';fs.mkdirSync(out,{recursive:true});
const engine=new GardenEngine();engine.state.settings.autonomous=false;engine.state.room.autonomous=false;engine.state.room.wandering=false;
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1000,height:900}});
 await page.addInitScript(state=>{
  const q=new URLSearchParams(location.search),pose=q.get('rigPose')??'wave',edge=Number(q.get('edge'));
  for(const id of ['shiori','gemini','glm','kimi','grok'])Object.assign(state.bodies[id],{pose,until:Date.now()+15000,interaction:undefined,stoppedAt:undefined});
  const r=state.room.residents.kimi;r.x=edge;r.from={x:edge,y:r.y};
  if(pose.startsWith('walk')){r.from.x=pose==='walk-left'?96:4;r.x=pose==='walk-left'?4:96;r.startedAt=Date.now();r.arrivesAt=Date.now()+4000;}
  window.garden={getState:async()=>state,subscribe:()=>()=>{},dispatch:async()=>{},window:()=>{},hitTest:()=>{},openPrivate:()=>{},keyStatus:async()=>[],saveKey:async()=>{},testConnection:async()=>({ok:false})};
 },JSON.parse(JSON.stringify(engine.state)));
 for(const pose of ['wave','jump','sad','wait','think','read','walk-left','walk-right'])for(const edge of [1,99]){
  await page.goto(`http://127.0.0.1:4319/dist/index.html?view=chat&rigPose=${pose}&edge=${edge}`);
  await page.waitForFunction(()=>document.querySelector('.room-character[data-character=kimi] .rig-canvas')?.dataset.motionTime);
  let minimum=Infinity;const frames=new Set();
  for(let sample=0;sample<16;sample++){
   const evidence=await page.locator('.room-character[data-character=kimi] .rig-canvas').evaluate(c=>{
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,r=0,t=c.height,b=0,count=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);count++;}
    const cr=c.getBoundingClientRect(),root=c.closest('.sprite').getBoundingClientRect(),opaque={left:cr.left+l/c.width*cr.width,right:cr.left+r/c.width*cr.width,top:cr.top+t/c.height*cr.height,bottom:cr.top+b/c.height*cr.height};
    const clip=[];for(let el=c;el;el=el.parentElement){const s=getComputedStyle(el),r=el.getBoundingClientRect();if(/paint|strict|content/.test(s.contain)||/(hidden|clip|scroll|auto)/.test(s.overflowX+' '+s.overflowY))if(opaque.left<r.left-.75||opaque.right>r.right+.75||opaque.top<r.top-.75||opaque.bottom>r.bottom+.75)clip.push(el.className);}
    return{count,margin:Math.min(l,t,c.width-r,c.height-b),clip,frame:c.dataset.rigFrame,error:c.dataset.error,anchorError:Math.max(Math.abs(cr.left+48/312*cr.width-root.left),Math.abs(cr.top+48/336*cr.height-root.top))};
   });
   assert.ok(evidence.count>500,'Kimi frame must actually paint');assert.ok(evidence.margin>2,`${pose} clips inside canvas`);assert.ok(evidence.anchorError<.5,'padding must not move or scale the character');assert.deepEqual(evidence.clip,[],`${pose} at edge ${edge} is clipped by a parent`);assert.equal(evidence.error,undefined);
   minimum=Math.min(minimum,evidence.margin);frames.add(evidence.frame);await page.waitForTimeout(150);
  }
  results.push({pose,edge,minimumPaintMargin:minimum,paintedFrames:[...frames]});
  if(pose.startsWith('walk'))assert.ok(frames.size>=4,'walking check must exercise moving frames');
  if(edge===99)await page.screenshot({path:`${out}/kimi-${pose}.png`,fullPage:true});
 }
 fs.writeFileSync(out+'/verification.json',JSON.stringify({allPassed:true,bodySizeAndFootAnchorPreserved:true,results},null,2));
 console.log('PASS Kimi eight poses at both room edges: padded canvas, visible pixels, fixed anchors and no clipping ancestors.');
}finally{await browser.close();}
