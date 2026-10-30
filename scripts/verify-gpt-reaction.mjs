import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('test-results/gpt-p1-integration');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const packaged=process.argv.includes('--packaged');
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const errors=[];
try{
 await app.firstWindow();let main,overlay;
 assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),path.resolve(env.GARDEN_TEST_DATA));
 for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main);assert.ok(overlay);for(const p of [main,overlay])p.on('pageerror',e=>errors.push(e.message));
 await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});});
 const selector='.room-character[data-character=shiori] .reaction-video-sprite';
 const reaction=main.locator(selector),video=reaction.locator('video.reaction-video');
 await main.waitForFunction(s=>document.querySelector(s)?.querySelector('video')?.readyState>=2,selector);
 const media=await video.evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)visible++;return{width:v.videoWidth,height:v.videoHeight,duration:v.duration,corners:[d[3],d[c.width*4-1],d[d.length-1]],visible};});
 assert.equal(media.width,640);assert.equal(media.height,360);assert.ok(media.duration>5&&media.duration<5.1);assert.deepEqual(media.corners,[0,0,0]);assert.ok(media.visible>10000);
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'shiori'}));
 await main.waitForFunction(s=>document.querySelector(s)?.dataset.motionPhase==='gesture',selector);
 await main.waitForTimeout(1800);await main.screenshot({path:path.join(out,packaged?'packaged-pat.png':'room-pat.png'),scale:'css'});
 const before=await video.evaluate(v=>v.currentTime);
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'shiori'}));await main.waitForTimeout(200);
 assert.ok(await video.evaluate(v=>v.currentTime)>before,'second pat must not restart running clip');
 // The ordinary engine cue expires before 5 seconds; the video must finish anyway.
 await main.waitForFunction(s=>document.querySelector(s)?.querySelector('video')?.currentTime>4.5,selector);
 assert.equal(await reaction.getAttribute('data-motion-phase'),'gesture');
 await main.waitForFunction(s=>{const e=document.querySelector(s),v=e?.querySelector('video');return e?.dataset.motionPhase==='gesture'&&v.currentTime<1;},selector);
 await main.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='idle',selector);
 await main.evaluate(()=>window.garden.dispatch({type:'feed',id:'shiori',food:'rice'}));await main.waitForTimeout(250);
 assert.equal(await reaction.getAttribute('data-clip'),'fallback','feeding keeps its own existing animation');
 await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock',chatForm:'chibi'}}));
 const pet=overlay.locator('.dock-pet[data-character=shiori]');await pet.waitFor();
 const box=await pet.locator('.pet-body').boundingBox();assert.ok(box);await overlay.mouse.move(box.x+box.width/2,box.y+box.height-12);
 await pet.locator('.reaction-video-sprite').waitFor();
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'shiori'}));
 await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=shiori] .reaction-video-sprite')?.dataset.motionPhase==='gesture');
 await overlay.waitForTimeout(1200);await overlay.screenshot({path:path.join(out,'dock-pat.png'),omitBackground:true,scale:'css'});
 await overlay.mouse.move(1,1);
 await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=shiori] .reaction-video-sprite video.reaction-video')?.currentTime>4.5);
 assert.equal(await pet.getAttribute('data-awake'),'true','moving pointer away must not perch before the full video ends');
 await main.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));await main.waitForTimeout(250);
 assert.ok(await video.evaluate(v=>v.paused));assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,packaged?'packaged-verification.json':'verification.json'),JSON.stringify({packaged,media,fullDuration:true,queuedPat:true,dockStanding:true,otherActionsPreserved:true,dndStops:true,errors},null,2));
 console.log('PASS GPT P1: full 5s, transparent, queued pats, fallback, dock standing, DND.',media);
}finally{await app.close();}
