// Real pointer dwell -> renderer -> IPC -> local SSE provider; isolated profile, no billing.
import {_electron as electron} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';
const out=path.resolve('test-results/hover-greeting');fs.mkdirSync(out,{recursive:true});
const requests=[];
const server=http.createServer(async(req,res)=>{
 let body='';for await(const part of req)body+=part;
 const event=JSON.parse(JSON.parse(body).messages.at(-1).content);requests.push(event);
 await new Promise(resolve=>setTimeout(resolve,1800));
 res.writeHead(200,{'Content-Type':'text/event-stream'});
 res.end('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify({beats:[{actor:event.actor,text:'……在看我？我也注意到你了。',intent:{action:'wave',emotion:'happy'}}]})}}]})+'\n\ndata: [DONE]\n\n');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const profile=path.join(out,'profile-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
try{
 await app.firstWindow();let house;
 for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(resolve=>setTimeout(resolve,100));}
 assert.ok(house);const errors=[];house.on('pageerror',e=>errors.push(e.message));await house.locator('.mini-frame').waitFor();
 const endpoint=`http://127.0.0.1:${server.address().port}/chat/completions`;
 await house.evaluate(async endpoint=>{
  await window.garden.saveKey('deepseek','fixture-key');
  await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'fixture',endpoint,tools:true}});
  await window.garden.dispatch({type:'settings',patch:{provider:'deepseek',model:'fixture',mode:'api',autonomous:false}});
  await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});
 },endpoint);
 const gpt=house.locator('.house-resident[data-character=shiori]');
 await gpt.hover();await house.waitForTimeout(180);await house.mouse.move(4,4);await house.waitForTimeout(900);
 assert.equal(requests.length,0,'passing across a resident is not a greeting');
 await gpt.hover();await house.waitForTimeout(160);await house.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));await house.waitForTimeout(1000);
 assert.equal(await gpt.getAttribute('data-attention'),null);assert.equal(requests.length,0);
 await house.mouse.move(4,4);await house.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:false}}));
 await gpt.hover();await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=shiori]')?.getAttribute('data-attention')==='noticed');
 assert.equal(await gpt.locator('.house-resident-art').evaluate(el=>getComputedStyle(el).animationIterationCount),'1');
 const beforeReply=await house.evaluate(()=>window.garden.getState());assert.equal(beforeReply.messages.filter(m=>m.origin?.backend==='model').length,0,'visual acknowledgement precedes the slow provider');
 await waitHouseState(house,s=>s.messages.some(m=>m.speaker==='shiori'&&m.origin?.backend==='model'));
 assert.equal(requests.length,1);assert.equal(requests[0].kind,'hover');assert.equal(requests[0].actor,'shiori');
 const media=gpt.locator('.reaction-video-sprite');
 assert.equal(await media.getAttribute('data-video-only'),'true');assert.equal(await media.locator('.reaction-fallback').count(),0);
 assert.match(await media.locator('.cast-idle-video').getAttribute('src'),/idle-subject-s1-clean-v3/);
 await house.evaluate(()=>window.garden.dispatch({type:'stop'}));await house.mouse.move(4,4);await gpt.hover();
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=shiori]')?.getAttribute('data-attention')==='noticed');
 await house.waitForTimeout(400);assert.equal(requests.length,1,'return visits can acknowledge silently during speech cooldown');
 assert.deepEqual(errors,[]);await house.screenshot({path:path.join(out,'gpt-hover.png'),omitBackground:true,scale:'css'});
 const report={success:true,packaged,realPointerDwell:true,autonomyNotRequired:true,instantAcknowledgementBeforeApi:true,quickPassCancelled:true,dndCancelled:true,cooldownStillAcknowledges:true,singleAnimation:true,approvedGptIdentity:true,requests:requests.length,errors};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await app.close();server.close();}
