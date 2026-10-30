import {_electron as electron} from 'playwright';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('test-results/animation-lab/cast-v1/gpt/doubao-pat-v3'),entry=path.join(root,'repair-qa.cjs');
fs.writeFileSync(entry,`const {app,BrowserWindow}=require('electron');app.setPath('userData',${JSON.stringify(path.join(root,'repair-profile'))});app.whenReady().then(()=>new BrowserWindow({width:1140,height:1100,show:false,webPreferences:{backgroundThrottling:false}}).loadURL('http://127.0.0.1:4319/test-results/animation-lab/cast-v1/gpt/doubao-pat-v3/repair-review.html'));`);
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const app=await electron.launch({args:[entry],env});
try{
const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.waitForFunction(()=>document.querySelectorAll('video').length===2&&[...document.querySelectorAll('video')].every(v=>v.readyState>=2));
await page.getByRole('button',{name:'错误最明显处',exact:true}).click();await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.paused&&!v.seeking&&Math.abs(v.currentTime-130/24)<.05));
const samples=await page.locator('video').evaluateAll(vs=>vs.map(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let badTip=0,opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)opaque++;for(let y=230;y<255;y++)for(let z=433;z<458;z++)if(d[(y*c.width+z)*4+3]>150)badTip++;return{w:v.videoWidth,h:v.videoHeight,duration:v.duration,opaque,corners:[d[3],d[c.width*4-1],d[d.length-1]],badTip}}));
for(const v of samples){assert.equal(v.w,640);assert.equal(v.h,360);assert.ok(v.duration>10);assert.deepEqual(v.corners,[0,0,0]);assert.ok(v.opaque>10000)}
assert.ok(samples[0].badTip>20,'original contains the false upper tip');assert.ok(samples[1].badTip<samples[0].badTip*.1,'false upper tip removed');
await page.screenshot({path:path.join(root,'repair-review-dark.png'),fullPage:true});await page.getByRole('button',{name:'切换底色'}).click();await page.screenshot({path:path.join(root,'repair-review-light.png'),fullPage:true});
await page.getByRole('button',{name:'从头同步'}).click();await page.waitForTimeout(700);assert.ok(await page.locator('#after').evaluate(v=>!v.paused&&v.currentTime>.3));assert.deepEqual(errors,[]);
fs.writeFileSync(path.join(root,'repair-playback-verification.json'),JSON.stringify({samples,errors,productionApproved:false},null,2));console.log('PASS alpha decode, original false tip present, repaired false tip absent, synced seek and playback.',samples);
}finally{await app.close()}
