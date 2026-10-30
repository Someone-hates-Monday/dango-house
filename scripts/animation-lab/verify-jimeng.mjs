import {_electron as electron} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const folder=path.resolve('test-results/animation-lab/claude/jimeng-idle-v1');
const entry=path.join(folder,'review-qa.cjs'),profile=path.join(folder,'qa-profile');
fs.writeFileSync(entry,`const {app,BrowserWindow}=require('electron');app.setPath('userData',${JSON.stringify(profile)});app.whenReady().then(()=>{const w=new BrowserWindow({width:1180,height:950,show:false,webPreferences:{backgroundThrottling:false}});w.loadURL('http://127.0.0.1:4319/test-results/animation-lab/claude/jimeng-idle-v1/review.html');});`);
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[entry],env});
try{
 const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.waitForFunction(()=>[...document.querySelectorAll('video')].length===2&&[...document.querySelectorAll('video')].every(v=>v.readyState>=2));
 await page.getByRole('button',{name:'从头比较',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('#loop').textContent.match(/\d+/)?.[0])>=2,{},{timeout:15000});
 const metadata=await page.evaluate(()=>{
  const v=document.querySelector('#alpha'),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
  const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>240)opaque++;
  return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,loops:document.querySelector('#loop').textContent,corners:[pixels[3],pixels[c.width*4-1],pixels[pixels.length-1]],opaquePixels:opaque,decodedFrames:v.getVideoPlaybackQuality().totalVideoFrames};
 });
 assert.equal(metadata.width,640);assert.equal(metadata.height,360);assert.deepEqual(metadata.corners,[0,0,0]);assert.ok(metadata.opaquePixels>10000);assert.ok(metadata.decodedFrames>100);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(folder,'review-dark.png'),fullPage:true});
 await page.getByRole('button',{name:'切换透明版底色',exact:true}).click();await page.screenshot({path:path.join(folder,'review-light.png'),fullPage:true});
 fs.writeFileSync(path.join(folder,'playback-verification.json'),JSON.stringify({...metadata,productionApproved:false},null,2));
 console.log('PASS real Electron video decode, two loop boundaries, alpha corners, opaque character and both backgrounds.',metadata);
}finally{await app.close();}
