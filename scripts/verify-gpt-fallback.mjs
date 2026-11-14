import {_electron as electron} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/gpt-identity-audit');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const report={packaged,loops:0,poses:[],videoOnly:true,success:false};
try{
 await app.firstWindow();let page;
 for(let i=0;i<100&&!page;i++){page=app.windows().find(p=>p.url().includes('view=chat'));if(!page)await new Promise(r=>setTimeout(r,100));}
 assert.ok(page);
 const send=a=>page.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{mode:'demo',autonomous:false}});
 await send({type:'room-settings',patch:{autonomous:false,wandering:false}});
 const selector='.room-character[data-character=shiori] .reaction-video-sprite';
 await page.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='idle',selector);
 assert.equal(await page.locator(selector+' .reaction-fallback,'+selector+' canvas,'+selector+' img,'+selector+' image').count(),0,'GPT standing surface must not mount an alternate image');
 for(let i=0;i<4;i++){
  await page.locator(selector+' .cast-idle-video').evaluate(async v=>{await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=v.duration-.08;});await v.play();});
  const clips=await page.evaluate(async s=>{const clips=[];const start=performance.now();while(performance.now()-start<450){await new Promise(requestAnimationFrame);clips.push(document.querySelector(s)?.dataset.clip);}return clips;},selector);
  assert.ok(clips.length>5);assert.ok(clips.every(c=>c==='idle'),'loop boundary must not reveal fallback');report.loops++;
 }
 for(const action of ['think','wave','read','jump','sad']){
  await send({type:'perform',id:'shiori',intent:{action,duration:1}});
  const clips=await page.evaluate(async s=>{const clips=[];const start=performance.now();while(performance.now()-start<1100){await new Promise(requestAnimationFrame);clips.push(document.querySelector(s)?.dataset.clip);}return clips;},selector);
  assert.ok(clips.every(c=>c==='idle'),'unsupported cue must keep the approved video, never alternate art');
  assert.equal(await page.locator(selector+' .reaction-fallback,'+selector+' canvas').count(),0);
  await page.locator('.room-character[data-character=shiori]').screenshot({path:path.join(out,`video-only-${action}.png`)});
  report.poses.push(action);
  await send({type:'perform',id:'shiori',intent:{action:'idle',duration:1}});
  await page.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='idle',selector);
 }
 await send({type:'pat',id:'shiori'});
 await page.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='pat',selector);
 await page.waitForFunction(s=>document.querySelector(s)?.dataset.clip==='idle',selector);
 report.fullPatReturnsToVideo=true;
 for(const name of ['waiting','stalled','error']){
  await page.locator(selector+' .cast-idle-video').evaluate((v,name)=>v.dispatchEvent(new Event(name)),name);
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator(selector).getAttribute('data-clip'),'fallback');
  assert.equal(await page.locator(selector+' .reaction-fallback').count(),0);
 }
 report.mediaEventsCannotRevealAtlas=true;
 report.success=true;
}catch(e){report.failure=e.message;process.exitCode=1;}
finally{await app.close();fs.writeFileSync(path.join(out,'fallback-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
