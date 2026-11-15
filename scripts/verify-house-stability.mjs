// Native geometry and decoded media checks; isolated demo profile, no API calls.
import {_electron as electron} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/house-stability');fs.mkdirSync(out,{recursive:true});
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const profile=path.join(out,'profile-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
const errors=[],clips=[];
try{
 await app.firstWindow();let house;for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(r=>setTimeout(r,100));}
 assert.ok(house);house.on('pageerror',e=>errors.push(e.message));await house.locator('.mini-frame').waitFor();
 const send=a=>house.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{autonomous:false}});await send({type:'room-settings',patch:{autonomous:false,wandering:false}});await house.waitForTimeout(500);
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=house'));w.setPosition(500,350);});await house.waitForTimeout(300);
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=house')),original=w.setBounds.bind(w);globalThis.__resizeCalls=[];w.setBounds=(b,...args)=>{globalThis.__resizeCalls.push({...b});return original(b,...args);};});
 await send({type:'send',text:'大家好，今天过得怎么样？'});
 const bubbles=await house.evaluate(async()=>{let seen=false,gaps=0;for(let i=0;i<90;i++){await new Promise(r=>setTimeout(r,50));const has=!!document.querySelector('.house-speech');if(has)seen=true;else if(seen)gaps++;}return{seen,gaps};});
 assert.equal(bubbles.seen,true);assert.equal(bubbles.gaps,0,'new speech must not vanish while waiting for the next timer tick');
 // Re-querying unchanged layout must not force a compositor resize either.
 await house.evaluate(async()=>{for(let i=0;i<5;i++)await window.garden.houseLayout();});
 const resizes=await app.evaluate(()=>globalThis.__resizeCalls);assert.equal(resizes.length,0,'dialogue and unchanged layout must not call native setBounds');
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=house')),original=w.setIgnoreMouseEvents.bind(w);globalThis.__hitChanges=0;w.setIgnoreMouseEvents=(...args)=>{globalThis.__hitChanges++;return original(...args);};});
 const frame=await house.locator('.mini-frame').boundingBox();for(let i=0;i<30;i++)await house.mouse.move(frame.x+40+i,frame.y+frame.height-22);
 const hitChanges=await app.evaluate(()=>globalThis.__hitChanges);assert.ok(hitChanges<=1,'mouse movement inside the house must not repeatedly change native transparency');
 await send({type:'stop'});
 const root=id=>`.house-resident[data-character=${id}] .video-sprite`;
 const ready=async(id,clip,timeout=5000)=>{
  await house.waitForFunction(({selector,clip})=>{const e=document.querySelector(selector),v=e?.querySelector('video');return e?.dataset.clip===clip&&v?.readyState>=2&&!v.paused&&v.currentTime>.12;},{selector:root(id),clip},{timeout});clips.push({actor:id,clip});
 };
 await send({type:'settings',patch:{dnd:true}});await house.waitForTimeout(300);
 assert.equal(await house.locator(root('rin')+' video').evaluate(v=>v.paused),true);
 await send({type:'settings',patch:{dnd:false}});await ready('rin','idle');
 const time=await house.locator(root('rin')+' video').evaluate(v=>v.currentTime);await house.waitForTimeout(400);
 assert.ok(await house.locator(root('rin')+' video').evaluate((v,time)=>v.currentTime>time+.2,time),'Claude idle must recover from DND');
 // A new directly requested clip must preempt an older gesture, not wait unseen.
 for(const clip of ['affection','chat','bookmark','success']){await send({type:'play-clip',id:'rin',clipId:clip});await ready('rin',clip,2200);}
 await send({type:'pat',id:'rin'});await ready('rin','pat',1800);
 await send({type:'feed',id:'rin',food:'rice'});await ready('rin','rice',1800);
 await ready('rin','idle',7500);
 await send({type:'stop'});await ready('rin','idle');
 for(const clip of ['wave','happy','shy','rice']){await send({type:'play-clip',id:'xia',clipId:clip});await ready('xia',clip,2200);}
 await ready('xia','idle',12000);
 await send({type:'stop'});
 await house.evaluate(()=>window.garden.houseLayout({width:500,height:400,chatOpen:false,cgHeight:248}));
 await send({type:'perform',id:'rin',intent:{action:'read',target:'xia',duration:4}});
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=rin]')?.dataset.moving==='true');
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=rin]')?.dataset.moving==='false');
 await ready('rin','bookmark',2000);
 await send({type:'perform',id:'xia',intent:{action:'read',target:'window',duration:4}});
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=xia]')?.dataset.moving==='true');
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=xia]')?.dataset.moving==='false');
 await house.waitForFunction(selector=>{const e=document.querySelector(selector),v=e?.querySelector('video');return e&&e.dataset.clip!=='idle'&&e.dataset.clip!=='walk'&&v.readyState>=2&&!v.paused&&v.currentTime>.12;},root('xia'),{timeout:2000});
 assert.deepEqual(errors,[]);
 const result={success:true,packaged,nativeResizesDuringDialogue:resizes.length,nativeHitChangesFor30Moves:hitChanges,continuousBubbles:true,claudeIdleRecoversFromDnd:true,directClips:clips,arrivalGesturesPlay:true,errors};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await app.close();}
