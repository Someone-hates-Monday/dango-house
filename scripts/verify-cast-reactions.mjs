import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('test-results/cast-reactions');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const ids=['gemini','glm'],errors=[],media=[];
try{
 await app.firstWindow();let main,overlay;
 assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),path.resolve(env.GARDEN_TEST_DATA));
 for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main);assert.ok(overlay);for(const p of [main,overlay])p.on('pageerror',e=>errors.push(e.message));
 await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});});
 for(const id of ids){
  const selector=`.room-character[data-character=${id}] .reaction-video-sprite`;
  await main.waitForFunction(s=>document.querySelector(s)?.querySelector('video')?.readyState>=2,selector);
  const m=await main.locator(selector+' video.reaction-video').evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)visible++;return{duration:v.duration,width:v.videoWidth,height:v.videoHeight,corners:[d[3],d[c.width*4-1],d[d.length-1]],visible};});
  assert.ok(m.duration>10&&m.duration<10.1);assert.deepEqual(m.corners,[0,0,0]);assert.ok(m.visible>10000);media.push({id,...m});
 }
 const pats=()=>main.evaluate(async ids=>{for(const id of ids)await window.garden.dispatch({type:'pat',id});},ids);
 await pats();
 await main.waitForFunction(ids=>ids.every(id=>document.querySelector(`.room-character[data-character=${id}] .reaction-video-sprite`)?.dataset.motionPhase==='gesture'),ids);
 await main.waitForTimeout(2300);await main.screenshot({path:path.join(out,packaged?'packaged-pat.png':'room-pat.png'),scale:'css'});
 const gemini=main.locator('.room-character[data-character=gemini] .reaction-video-sprite video.reaction-video');
 const before=await gemini.evaluate(v=>v.currentTime);
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'gemini'}));await main.waitForTimeout(200);
 assert.ok(await gemini.evaluate(v=>v.currentTime)>before,'queued click does not restart');
 await main.waitForFunction(ids=>ids.every(id=>document.querySelector(`.room-character[data-character=${id}] .reaction-video-sprite video.reaction-video`)?.currentTime>9.5),ids);
 await main.waitForFunction(()=>document.querySelector('.room-character[data-character=glm] .reaction-video-sprite')?.dataset.clip==='idle');
 await main.waitForFunction(()=>{const e=document.querySelector('.room-character[data-character=gemini] .reaction-video-sprite');return e?.dataset.motionPhase==='gesture'&&e.querySelector('video').currentTime<2;});
 await main.waitForFunction(()=>document.querySelector('.room-character[data-character=gemini] .reaction-video-sprite')?.dataset.clip==='idle');
 await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock',chatForm:'chibi'}}));
 await pats();
 await overlay.waitForFunction(ids=>ids.every(id=>document.querySelector(`.dock-pet[data-character=${id}] .reaction-video-sprite`)?.dataset.motionPhase==='gesture'),ids);
 await overlay.mouse.move(1,1);
 await overlay.waitForFunction(ids=>ids.every(id=>document.querySelector(`.dock-pet[data-character=${id}] .reaction-video-sprite video.reaction-video`)?.currentTime>9.5),ids);
 for(const id of ids)assert.equal(await overlay.locator(`.dock-pet[data-character=${id}]`).getAttribute('data-awake'),'true','dock stays awake for real duration');
 await overlay.screenshot({path:path.join(out,'dock-pat.png'),omitBackground:true,scale:'css'});
 await main.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));
 await overlay.waitForFunction(ids=>ids.every(id=>document.querySelector(`.dock-pet[data-character=${id}] .reaction-video-sprite video.reaction-video`)?.paused),ids);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,packaged?'packaged-verification.json':'verification.json'),JSON.stringify({packaged,media,completeTenSeconds:true,queuedPat:true,returnToExistingIdle:true,dockFinishesBeforePerching:true,dndStops:true,errors},null,2));
 console.log('PASS Gemini and GLM: transparent full 10s, queue, return, dock, DND.');
}finally{await app.close();}
