import {_electron as electron} from 'playwright';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/floating-layout');fs.mkdirSync(out,{recursive:true});const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[process.cwd()],env});const report={checks:[],errors:[]};
try{
 await app.firstWindow();let main,overlay;for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main&&overlay);overlay.on('pageerror',e=>report.errors.push(e.message));const send=a=>main.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{autonomous:false,mode:'demo'}});await send({type:'room-settings',patch:{autonomous:false,wandering:false}});await send({type:'cast-preset',preset:'core'});
 const check=async(mode)=>{
  await send({type:'presentation',patch:{desktopMode:mode}});
  await send({type:'perform',id:'rin',intent:{action:'wave',duration:15,bubble:'我在这里认真听你说话。菜单和CG都要给对话留出位置。'}});
  const menus=overlay.locator('.companion-interactions.compact');await menus.first().waitFor();await menus.first().evaluate(e=>e.open=true);await overlay.waitForTimeout(500);
  const result=await overlay.evaluate(()=>{const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;const panel=document.querySelector('.companion-interactions.compact[open] > .companion-panel');const r=panel.getBoundingClientRect();const bubbles=[...document.querySelectorAll('.pet-bubble')].filter(e=>getComputedStyle(e).visibility!=='hidden');return{inBounds:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overlap:bubbles.some(e=>overlap(r,e.getBoundingClientRect()))};});
  assert.ok(result.inBounds,`${mode}: menu offscreen`);assert.equal(result.overlap,false,`${mode}: bubble overlaps menu`);
  await send({type:'cg-preview',host:'desktop'});await overlay.waitForTimeout(600);
  const conflict=await overlay.evaluate(()=>{const a=document.querySelector('.companion-interactions.compact[open] > .companion-panel')?.getBoundingClientRect();const b=document.querySelector('.cg-moment,.cg-memory-chip')?.getBoundingClientRect();return a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert.ok(!conflict,`${mode}: CG overlaps menu`);
  await overlay.screenshot({path:path.join(out,mode+'.png'),omitBackground:true});
  await menus.nth(1).evaluate(e=>e.open=true);await overlay.waitForTimeout(200);assert.equal(await overlay.locator('.companion-interactions.compact[open]').count(),1);
  await overlay.locator('.companion-interactions.compact[open] .interaction-close').click({force:true});report.checks.push(`${mode}: menu within viewport, speech and CG avoid menu, only one menu open`);
 };
 await check('dock');await check('free');assert.deepEqual(report.errors,[]);report.success=true;
}catch(e){report.success=false;report.failure=e.message;process.exitCode=1;}finally{await app.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}


