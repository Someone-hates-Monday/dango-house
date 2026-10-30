import {chromium} from 'playwright';
import {GardenEngine} from '../electron/engine.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='test-results/video-bounds';fs.mkdirSync(out,{recursive:true});
const engine=new GardenEngine();engine.state.settings.autonomous=false;engine.state.room.autonomous=false;engine.state.room.wandering=false;
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:950}});
 page.on('pageerror',e=>console.error('Local render:',e.message));
 // Local application test only: no user profile, remote site or native input.
 await page.addInitScript(state=>{
  state.presentation.chatForm='chibi';state.presentation.desktopMode=new URLSearchParams(location.search).get('testMode')??'free';
  for(const id of ['shiori','gemini','glm'])Object.assign(state.bodies[id],{interaction:{kind:'pat',startedAt:Date.now()},until:Date.now()+20000,pose:'wait',stoppedAt:undefined});
  window.garden={getState:async()=>state,subscribe:()=>()=>{},dispatch:async()=>{},window:()=>{},hitTest:()=>{},openPrivate:()=>{},keyStatus:async()=>[],saveKey:async()=>{},testConnection:async()=>({ok:false})};
 },JSON.parse(JSON.stringify(engine.state)));
 await page.goto('http://127.0.0.1:4319/dist/index.html?view=chat');
 await page.waitForFunction(()=>document.querySelector('.room-character[data-character=shiori] .reaction-video-sprite')?.dataset.motionPhase==='gesture').catch(async e=>{await page.screenshot({path:out+'/render-error.png',fullPage:true});console.error(await page.locator('body').innerText());throw e;});
 for(const width of [1280,900]){
  await page.setViewportSize({width,height:950});
  for(const frame of [33,55]){
   const selector='.room-character[data-character=shiori] .reaction-video-sprite video.reaction-video';
   await page.locator(selector).evaluate((v,t)=>{v.pause();v.currentTime=t;},frame/24);
   await page.waitForFunction(s=>{const v=document.querySelector(s);return v?.readyState>=2&&!v.seeking;},selector);
   const sample=await page.locator(selector).evaluate(v=>{
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
    let left=c.width,right=0,top=c.height,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    const r=v.getBoundingClientRect(),opaque={left:r.left+left/c.width*r.width,right:r.left+right/c.width*r.width,top:r.top+top/c.height*r.height,bottom:r.top+bottom/c.height*r.height};
    const clips=[];for(let el=v;el;el=el.parentElement){const style=getComputedStyle(el),box=el.getBoundingClientRect();if(/paint|strict|content/.test(style.contain)||/(hidden|clip|scroll|auto)/.test(style.overflowX+' '+style.overflowY)){if(opaque.left<box.left-.75||opaque.right>box.right+.75||opaque.top<box.top-.75||opaque.bottom>box.bottom+.75)clips.push({class:el.className,contain:style.contain,overflow:style.overflow,box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom}});}}
    const root=v.closest('.sprite'),box=root.getBoundingClientRect();return{opaque,clips,rootContain:getComputedStyle(root).contain,extendsOutsideSprite:opaque.left<box.left||opaque.right>box.right};
   });
   assert.deepEqual(sample.clips,[],`GPT frame ${frame} at ${width}px is clipped`);assert.equal(sample.rootContain,'layout');
   results.push({width,frame,...sample});
  }
 }
 for(const id of ['xia','rin']){
  const selector=`.room-character[data-character=${id}] .video-sprite`;
  const style=await page.locator(selector).evaluate(root=>{const v=root.querySelector('video'),r=v.getBoundingClientRect();return{contain:getComputedStyle(root).contain,overflow:getComputedStyle(root).overflow,fit:getComputedStyle(v).objectFit,aspect:r.width/r.height};});
  assert.equal(style.contain,'layout');assert.equal(style.overflow,'visible');assert.equal(style.fit,'fill');assert.ok(Math.abs(style.aspect-16/9)<.01);results.push({id,...style});
 }
 await page.screenshot({path:out+'/gpt-tail-unclipped.png',fullPage:true});
 for(const mode of ['free','dock','private']){
  const query=mode==='private'?'view=private&character=shiori':`view=pets&primary=true&display=0&testMode=${mode}`;
  await page.goto('http://127.0.0.1:4319/dist/index.html?'+query);
  const selector=mode==='private'?'.private-character .reaction-video-sprite video.reaction-video':'.desktop-pet[data-character=shiori] .reaction-video-sprite video.reaction-video';
  await page.waitForFunction(s=>document.querySelector(s)?.parentElement.dataset.motionPhase==='gesture',selector);
  await page.locator(selector).evaluate(v=>{v.pause();v.currentTime=33/24;});
  await page.waitForFunction(s=>{const v=document.querySelector(s);return v?.readyState>=2&&!v.seeking;},selector);
  const clipping=await page.locator(selector).evaluate(v=>{
   const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let l=c.width,r=0,t=c.height,b=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>64){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
   const rect=v.getBoundingClientRect(),opaque={left:rect.left+l/c.width*rect.width,right:rect.left+r/c.width*rect.width,top:rect.top+t/c.height*rect.height,bottom:rect.top+b/c.height*rect.height};
   const clips=[];for(let el=v;el;el=el.parentElement){const s=getComputedStyle(el),r=el.getBoundingClientRect();if(/paint|strict|content/.test(s.contain)||/(hidden|clip|scroll|auto)/.test(s.overflowX+' '+s.overflowY))if(opaque.left<r.left-.75||opaque.right>r.right+.75||opaque.top<r.top-.75||opaque.bottom>r.bottom+.75)clips.push(el.className);}
   return{clips,opaque};
  });
  assert.deepEqual(clipping.clips,[],`${mode} GPT tail is clipped`);results.push({mode,frame:33,...clipping});
  await page.screenshot({path:out+`/${mode}-tail-unclipped.png`});
 }
 fs.writeFileSync(out+'/verification.json',JSON.stringify({localHeadlessApp:true,results,errors:[]},null,2));
 console.log('PASS: GPT frames in room/free/dock/private without clipping; DS/Claude preserve full 16:9 video canvas.');
}finally{await browser.close();}
