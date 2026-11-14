import {_electron as electron} from 'playwright';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/review-2026-11-14');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`idle-profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged');
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});const report={success:false,packaged,samples:0,wraps:0,errors:[]};
try{
 await app.firstWindow();let main;
 for(let i=0;i<100&&!main;i++){main=app.windows().find(p=>p.url().includes('view=chat'));if(!main)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main);await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});});
 const selector='.room-character[data-character=shiori] .reaction-video-sprite';
 await main.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='idle',selector);
 assert.equal(await main.locator('.profile .version').innerText(),`v${version}`,'visible version must match the package');
 const duration=await main.locator(selector+' video.cast-idle-video').evaluate(v=>v.duration);
 assert.ok(Math.abs(duration-225/24)<.002,`encoded duration ${duration}: manifest alone cannot prove frame count`);
 const result=await main.evaluate(async s=>{
  const e=document.querySelector(s),v=e.querySelector('video.cast-idle-video');let previous=v.currentTime,wraps=0;const errors=[],frames=new Set();
  const c=document.createElement('canvas');c.width=80;c.height=45;const ctx=c.getContext('2d');
  const decoded=new Set(),pixels=document.createElement('canvas');pixels.width=640;pixels.height=360;const px=pixels.getContext('2d',{willReadFrequently:true});let maxDarkRatio=0,decodedCount=0,done=false;
  const observe=(now,metadata)=>{if(done)return;px.clearRect(0,0,640,360);px.drawImage(v,0,0);const data=px.getImageData(0,0,640,360).data;let solid=0,dark=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>220){solid++;if((data[i]+data[i+1]+data[i+2])/3<130)dark++;}maxDarkRatio=Math.max(maxDarkRatio,dark/solid);decoded.add(metadata.mediaTime.toFixed(3));decodedCount++;v.requestVideoFrameCallback(observe);};v.requestVideoFrameCallback(observe);
  for(let i=0;i<115;i++){await new Promise(r=>setTimeout(r,200));if(v.currentTime<previous-.5)wraps++;previous=v.currentTime;if(e.dataset.clip!=='idle')errors.push({clip:e.dataset.clip,time:previous});ctx.drawImage(v,0,0,80,45);frames.add(c.toDataURL());}
  done=true;return{samples:115,wraps,errors,source:v.currentSrc,distinctRenderedFrames:frames.size,decodedCount,uniqueDecodedTimestamps:decoded.size,maxDarkRatio};
 },selector);
 Object.assign(report,result);assert.ok(result.source.endsWith('/video/gpt/idle-subject-s1-clean-v3.webm'));assert.ok(result.wraps>=2);assert.deepEqual(result.errors,[]);
 assert.ok(result.distinctRenderedFrames>5,'standing room idle must visibly change pixels, not merely advance a timer');
 assert.equal(result.uniqueDecodedTimestamps,225,'decode the entire actual loop, including its tail');
 assert.ok(result.maxDarkRatio<.1,'regression: known grey/navy stale identity appears in decoded video');
 await main.locator(selector+' video.cast-idle-video').evaluate(v=>v.pause());
 await main.waitForFunction(s=>{const v=document.querySelector(s)?.querySelector('video.cast-idle-video');return v&&!v.paused;},selector);
 report.recoversUnexpectedIdlePause=true;
 // Stop during a reaction, then issue a new gesture: the paused reaction must resume,
 // rather than leaving playing=true and returning from the tick forever.
 const send=a=>main.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'pat',id:'shiori'});
 await main.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='pat',selector);
 await send({type:'stop'});
 const held=await main.locator(selector+' video.reaction-video').evaluate(v=>v.currentTime);
 await send({type:'perform',id:'shiori',intent:{action:'wave',duration:3}});
 await main.waitForFunction(({s,held})=>{const v=document.querySelector(s)?.querySelector('video.reaction-video');return v&&!v.paused&&v.currentTime>held+.15;},{s:selector,held});
 report.resumesAfterStop=true;
 await main.screenshot({path:path.join(out,'gpt-reviewed-idle.png'),scale:'css'});report.success=true;
}catch(e){report.failure=e.message;process.exitCode=1;}finally{await app.close();fs.writeFileSync(path.join(out,'gpt-idle-loop.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
