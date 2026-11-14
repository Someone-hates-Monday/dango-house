import {_electron as electron} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/cg-lab/runtime');fs.mkdirSync(out,{recursive:true});
assert.ok(fs.existsSync('public/cg/rin-xia-hair-v1/clip.webm'),'finish local generation and copy reviewed trial first');
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[process.cwd()],env});const report={checks:[],errors:[],limitations:['Physical Windows mouse click-through still requires native desktop acceptance; renderer controls are tested here.']};
try{
 await app.firstWindow();let main,overlay;
 for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main&&overlay);main.on('pageerror',e=>report.errors.push(e.message));overlay.on('pageerror',e=>report.errors.push(e.message));await main.waitForSelector('.room-character');const windows=app.windows().length;
 const send=action=>main.evaluate(action=>window.garden.dispatch(action),action);
 const snap=()=>main.evaluate(()=>window.garden.getState());
 const waitLive=async()=>{for(let i=0;i<400;i++){const state=await snap();if(state.cgSession)return state;await new Promise(r=>setTimeout(r,100));}throw new Error('CG prelude did not produce a session');};
 await send({type:'settings',patch:{mode:'demo',autonomous:false,petsVisible:true}});
 await send({type:'room-settings',patch:{autonomous:false,wandering:false}});
 await send({type:'presentation',patch:{desktopMode:'dock'}});
 await send({type:'select',id:'rin'});
 await send({type:'cg-preview',host:'room'});await waitLive();
 const room=main.locator('.cg-moment--room');
 const roomChip=main.locator('.cg-memory-chip--room');
 await Promise.race([room.waitFor({timeout:40000}),roomChip.waitFor({timeout:40000})]);
 if(await roomChip.count()&&!(await room.count())){
  report.checks.push('room overhead folded to chip when headroom tight');
  await roomChip.click();
  await room.waitFor({timeout:8000});
  report.checks.push('chip expand uses stage fallback');
 }
 if(await room.count()){
  await main.waitForFunction(()=>{const v=document.querySelector('.cg-moment--room video');return !!v&&v.readyState>=2&&!v.paused;},{timeout:15000});
  assert.equal(await overlay.locator('.cg-moment').count(),0);assert.equal(app.windows().length,windows);
  const box=await room.boundingBox(),canvas=await main.locator('.dollhouse').boundingBox();
  assert.ok(box&&canvas&&box.width<=canvas.width*.55+4);
  const video=await room.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,muted:v.muted}));
  assert.equal(video.width,832);assert.equal(video.height,480);assert.ok(video.duration>4.8&&video.duration<5.3&&video.muted);
  await main.screenshot({path:path.join(out,'room-cg.png'),scale:'css'});
  report.checks.push('real room UI plays silent local clip; no new window');
  await room.getByRole('button',{name:'收起CG',exact:true}).click();
  await main.locator('.cg-memory-chip--room').click();
  await room.waitFor();
  report.checks.push('collapse and continue work');
  // Fresh session → explicit ended receipt (no bond/events).
  await send({type:'cg-preview',host:'room'});
  const playing=await waitLive();
  assert.ok(playing.cgSession?.id,`expected playing session, got ${JSON.stringify(playing.cgSession)}`);
  await send({type:'cg-complete',sessionId:playing.cgSession.id,outcome:'ended'});
  const ended=await snap();
  assert.equal(ended.cgSession??null,null);
  assert.equal(ended.cgLastReceipt?.outcome,'ended');
  assert.equal(ended.companionEvents.length,0);
  report.checks.push('ended receipt sealed without companion events');
}else{
  throw new Error('room CG neither card nor expandable chip appeared');
 }
 await send({type:'cg-preview',host:'desktop'});await waitLive();
 const desktop=overlay.locator('.cg-moment--desktop');
 const deskChip=overlay.locator('.cg-memory-chip--desktop');
 await Promise.race([desktop.waitFor({timeout:40000}),deskChip.waitFor({timeout:40000})]);
 if(await deskChip.count()&&!(await desktop.count()))await deskChip.click();
 await desktop.waitFor({timeout:8000});
 await overlay.waitForFunction(()=>{const v=document.querySelector('.cg-moment--desktop video');return !!v&&v.readyState>=2&&!v.paused;},{timeout:15000});
 assert.equal(await main.locator('.cg-moment').count(),0);assert.equal(app.windows().length,windows);
 const bounds=await desktop.boundingBox(),viewport=await overlay.evaluate(()=>({w:innerWidth,h:innerHeight}));
 assert.ok(bounds&&bounds.x>=-4&&bounds.y>=-4&&bounds.x+bounds.width<=viewport.w+4);
 await overlay.screenshot({path:path.join(out,'desktop-cg.png'),omitBackground:true,scale:'css'});
 await desktop.getByRole('button',{name:'关闭CG',exact:true}).click();
 await desktop.waitFor({state:'detached'});
 const cancelled=await snap();
 assert.equal(cancelled.cgLastReceipt.outcome,'cancelled');
 assert.equal(cancelled.companionEvents.length,0);
 report.checks.push('one desktop host, close seals cancelled without rewards');
 await send({type:'cg-preview',host:'room'});await waitLive();
 await send({type:'settings',patch:{dnd:true}});
 await main.waitForTimeout(300);
 assert.equal(await main.locator('.cg-moment--room').count(),0);
 const dnd=await snap();
 assert.equal(dnd.cgLastReceipt.outcome,'cancelled');
 report.checks.push('DND cancels without replay');
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(e){report.success=false;report.failure=e.message;process.exitCode=1;console.error(e);}
finally{await app.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
