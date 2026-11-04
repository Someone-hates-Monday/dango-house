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
 await send({type:'settings',patch:{mode:'demo',autonomous:false}});await send({type:'room-settings',patch:{autonomous:false,wandering:false}});await send({type:'presentation',patch:{desktopMode:'dock'}});
 await main.locator('.cg-preview-buttons > summary').click();await main.getByRole('button',{name:'在小屋试看 CG',exact:true}).click();
 const room=main.locator('.cg-moment--room');await room.waitFor();await main.waitForFunction(()=>{const v=document.querySelector('.cg-moment--room video');return v?.readyState>=2&&!v.paused;});
 assert.equal(await overlay.locator('.cg-moment').count(),0);assert.equal(app.windows().length,windows);
 const box=await room.boundingBox(),canvas=await main.locator('.dollhouse').boundingBox();assert.ok(box.width<canvas.width*.46&&box.x>=canvas.x&&box.x+box.width<=canvas.x+canvas.width+1);
 const video=await room.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,muted:v.muted}));assert.equal(video.width,832);assert.equal(video.height,480);assert.ok(video.duration>4.8&&video.duration<5.3&&video.muted);
 await main.waitForTimeout(450);await main.screenshot({path:path.join(out,'room-cg.png'),scale:'css'});report.checks.push('real room UI plays complete silent local clip inside its stage; no new window');
 await room.getByRole('button',{name:'收起CG',exact:true}).click();await main.locator('.cg-memory-chip').click();await room.waitFor();report.checks.push('collapse and continue work');
 await main.locator('.cg-preview-buttons > summary').click();await main.getByRole('button',{name:'在桌面试看 CG',exact:true}).click();const desktop=overlay.locator('.cg-moment--desktop');await desktop.waitFor();await overlay.waitForFunction(()=>{const v=document.querySelector('.cg-moment--desktop video');return v?.readyState>=2&&!v.paused;});
 assert.equal(await main.locator('.cg-moment').count(),0);assert.equal(app.windows().length,windows);
 const bounds=await desktop.boundingBox(),viewport=await overlay.evaluate(()=>({w:innerWidth,h:innerHeight}));assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.w&&bounds.y+bounds.height<=viewport.h-140);assert.ok(bounds.width*bounds.height<viewport.w*viewport.h*.25);
 await overlay.waitForTimeout(450);await overlay.screenshot({path:path.join(out,'desktop-cg.png'),omitBackground:true,scale:'css'});await desktop.getByRole('button',{name:'关闭CG',exact:true}).click();await desktop.waitFor({state:'detached'});report.checks.push('one desktop host, bounded card above Dock, working renderer close control');
 await send({type:'cg-preview',host:'room'});await room.waitFor();await send({type:'settings',patch:{dnd:true}});await room.waitFor({state:'detached'});report.checks.push('DND dismisses without replay');
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(e){report.success=false;report.failure=e.message;process.exitCode=1;console.error(e);}finally{await app.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
