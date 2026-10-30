import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('test-results/cast-idle');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const ids=['shiori','gemini','glm','kimi','grok'],errors=[];
try{
 await app.firstWindow();assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),path.resolve(env.GARDEN_TEST_DATA));
 let main,overlay;for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main);assert.ok(overlay);for(const p of [main,overlay])p.on('pageerror',e=>errors.push(e.message));
 await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});});
 await main.waitForFunction(ids=>ids.every(id=>{const e=document.querySelector(`.room-character[data-character=${id}] .reaction-video-sprite`),v=e?.querySelector('.cast-idle-video');return e?.dataset.clip==='idle'&&v.readyState>=2&&!v.paused;}),ids).catch(async e=>{console.error(await main.evaluate(ids=>ids.map(id=>{const r=document.querySelector(`.room-character[data-character=${id}]`),v=r?.querySelector('.cast-idle-video'),s=r?.querySelector('.reaction-video-sprite');return{id,pose:r?.querySelector('.character-motion')?.className,clip:s?.dataset.clip,phase:s?.dataset.motionPhase,error:s?.dataset.error,video:v&&{ready:v.readyState,paused:v.paused,src:v.src,error:v.error?.message}};}),ids));throw e;});
 const media=await main.evaluate(ids=>ids.map(id=>{const v=document.querySelector(`.room-character[data-character=${id}] .cast-idle-video`),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)opaque++;return{id,src:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration,loop:v.loop,corners:[d[3],d[c.width*4-1],d[d.length-1]],opaque,frames:v.getVideoPlaybackQuality().totalVideoFrames};}),ids);
 for(const m of media){assert.equal(m.width,640);assert.equal(m.height,360);assert.ok(m.duration>8);assert.ok(m.loop);assert.deepEqual(m.corners,[0,0,0]);assert.ok(m.opaque>7000);}
 await main.waitForTimeout(700);
 const advanced=await main.evaluate(ids=>ids.map(id=>document.querySelector(`.room-character[data-character=${id}] .cast-idle-video`).getVideoPlaybackQuality().totalVideoFrames),ids);
 for(let i=0;i<media.length;i++)assert.ok(advanced[i]>media[i].frames+5,`${ids[i]} idle must visibly advance`);
 await main.screenshot({path:path.join(out,packaged?'packaged-idle.png':'room-idle.png'),scale:'css'});
 await main.evaluate(ids=>{for(const id of ids){const v=document.querySelector(`.room-character[data-character=${id}] .cast-idle-video`);v.currentTime=v.duration-.15;}},ids);
 await main.waitForFunction(ids=>ids.every(id=>{const v=document.querySelector(`.room-character[data-character=${id}] .cast-idle-video`);return !v.paused&&v.currentTime<1;}),ids);
 await main.evaluate(()=>window.garden.dispatch({type:'perform',id:'kimi',intent:{action:'wave',duration:2}}));
 await main.waitForFunction(()=>document.querySelector('.room-character[data-character=kimi] .reaction-video-sprite')?.dataset.clip==='fallback');
 assert.ok(await main.locator('.room-character[data-character=kimi] .cast-idle-video').evaluate(v=>v.paused));
 await main.waitForFunction(()=>document.querySelector('.room-character[data-character=kimi] .reaction-video-sprite')?.dataset.clip==='idle');
 await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock',chatForm:'chibi'}}));
 const pet=overlay.locator('.dock-pet[data-character=kimi]');await pet.waitFor();const box=await pet.locator('.pet-body').boundingBox();await overlay.mouse.move(box.x+box.width/2,box.y+box.height-12);
 await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=kimi] .reaction-video-sprite')?.dataset.clip==='idle');
 await overlay.mouse.move(1,1);await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=kimi]')?.dataset.awake==='false');assert.equal(await pet.locator('.cast-idle-video').count(),0,'resting dock keeps its lying rig');
 await main.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));
 await main.waitForFunction(ids=>ids.every(id=>document.querySelector(`.room-character[data-character=${id}] .cast-idle-video`)?.paused),ids);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,packaged?'packaged-verification.json':'verification.json'),JSON.stringify({packaged,media,decodedFramesAdvance:true,loopsWrap:true,otherActionsUseRig:true,dockStandingIdle:true,dockRestPreserved:true,dndStops:true,errors},null,2));
 console.log('PASS five real idle videos: alpha, decoded movement, loop wrap, action fallback, dock standing/rest and DND.');
}finally{await app.close();}
