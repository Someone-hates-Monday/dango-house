import {_electron as electron} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out=path.resolve('test-results/review-2026-11-14');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged');
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const report={checks:[],errors:[],success:false,packaged,scope:packaged?'packaged renderer, isolated demo profile; not native mouse acceptance':'source build renderer, isolated demo profile; not portable/native mouse acceptance'};
try{
 await app.firstWindow();let main,overlay;
 for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main&&overlay);for(const p of [main,overlay])p.on('pageerror',e=>report.errors.push(e.message));
 const send=a=>main.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{mode:'demo',autonomous:false,petsVisible:true}});
 await send({type:'room-settings',patch:{autonomous:false,wandering:false}});
 for(const [asset,host] of [['rin-xia-cheek-t1','room'],['xia-reach-t1','room'],['gpt-close-t1','room'],['rin-xia-welcome-t1','desktop']]){
  const page=host==='room'?main:overlay;
  if(asset==='xia-reach-t1')await send({type:'cast-present',id:'xia',present:false});
  if(asset==='gpt-close-t1'){await send({type:'cast-present',id:'rin',present:false});await send({type:'cast-present',id:'shiori',present:true});}
  if(host==='desktop'){await send({type:'cast-present',id:'rin',present:true});await send({type:'cast-present',id:'xia',present:true});await send({type:'presentation',patch:{desktopMode:'dock'}});}
  await send({type:'cg-preview',host,asset});
  await page.waitForSelector('.cg-moment,.cg-memory-chip',{timeout:40000});
  if(await page.locator('.cg-memory-chip').count())await page.locator('.cg-memory-chip').click();
  await page.waitForFunction(asset=>{const e=document.querySelector('.cg-moment'),v=e?.querySelector('video');return e?.dataset.cgAsset===asset&&v?.readyState>=2&&!v.paused&&v.currentTime>.1;},asset,{timeout:10000});
  const media=await page.locator('.cg-moment video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,src:v.currentSrc.split('/').slice(-2).join('/')}));
  assert.equal(await page.locator('.cg-moment').count(),1,'one event must render one card for the whole cast');
  const other=host==='room'?overlay:main;assert.equal(await other.locator('.cg-moment').count(),0,'do not mirror the same event into another host');
  await page.screenshot({path:path.join(out,asset+'.png'),scale:'css',omitBackground:host==='desktop'});
  await main.waitForFunction(async asset=>{const s=await window.garden.getState();return !s.cgSession&&s.cgLastReceipt?.asset===asset&&s.cgLastReceipt.outcome==='ended';},asset,{timeout:15000});
  report.checks.push({asset,host,realEnded:true,media});console.log('PASS',asset,host);
 }
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(e){report.failure=e.message;process.exitCode=1;}
finally{await app.close();fs.writeFileSync(path.join(out,'cg-runtime.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
