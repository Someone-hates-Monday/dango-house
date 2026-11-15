import {_electron as electron} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';

const out=path.resolve('test-results/house-movement');fs.mkdirSync(out,{recursive:true});
const server=http.createServer(async(req,res)=>{
 for await(const _ of req){}
 const plan={gather:{actors:['xia','rin'],target:'window'},beats:[{actor:'xia',text:'窗边的位置留给你。',intent:{action:'shy',duration:2}},{actor:'rin',text:'那我带书过来，一起坐吧。',replyTo:'xia',intent:{action:'read',duration:2}}]};
 res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify(plan)}}]})+'\n\ndata: [DONE]\n\n');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version,packaged=process.argv.includes('--packaged');
const profile=path.join(out,'profile-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
const errors=[];
try{
 await app.firstWindow();let house;
 for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(r=>setTimeout(r,100));}
 assert.ok(house);house.on('pageerror',e=>errors.push(e.message));await house.locator('.house-scene').waitFor();
 const send=a=>house.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{autonomous:false}});await send({type:'room-settings',patch:{wandering:false,autonomous:false}});
 await house.evaluate(()=>window.garden.houseLayout({width:500,height:400,chatOpen:false,cgHeight:0}));
 const actor=house.locator('.house-resident[data-character=rin]'),before=await actor.boundingBox();
 await send({type:'perform',id:'rin',intent:{action:'approach',target:'xia',duration:2}});
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=rin]')?.dataset.moving==='true');
 const trace=await house.evaluate(async()=>{
  const frames=[];for(let i=0;i<80;i++){await new Promise(r=>requestAnimationFrame(r));frames.push([...document.querySelectorAll('.house-resident')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,id:e.dataset.character,moving:e.dataset.moving};}));}return frames;
 });
 for(const frame of trace)for(let a=0;a<frame.length;a++)for(let b=a+1;b<frame.length;b++){
  const p=frame[a],q=frame[b],overlap=Math.max(0,Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x))*Math.max(0,Math.min(p.y+p.h,q.y+q.h)-Math.max(p.y,q.y));
  assert.ok(overlap/(p.w*p.h)<=.51,'rendered overlap must stay below half');
 }
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=rin]')?.dataset.moving==='false');
 const after=await actor.boundingBox();assert.ok(after.x<before.x-15,'approach must move rendered pixels, not just play legs');
 const resting=await actor.boundingBox();await house.waitForTimeout(350);assert.ok(Math.abs((await actor.boundingBox()).x-resting.x)<1,'no snap back to a fixed slot');
 await house.evaluate(async port=>{await window.garden.saveKey('deepseek','fixture-only');await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'fixture',endpoint:`http://127.0.0.1:${port}/chat/completions`,tools:true}});await window.garden.dispatch({type:'settings',patch:{provider:'deepseek',model:'fixture',mode:'api'}});},server.address().port);
 await send({type:'send',text:'你们一起到窗边聊聊。'});
 await house.waitForFunction(()=>['xia','rin'].every(id=>document.querySelector(`.house-resident[data-character=${id}]`)?.dataset.moving==='true'));
 assert.equal(await house.evaluate(async()=>(await window.garden.getState()).messages.filter(m=>m.origin?.backend==='model').length),0);
 await house.screenshot({path:path.join(out,'gather-moving.png'),omitBackground:true,scale:'css'});
 await waitHouseState(house,s=>s.messages.filter(m=>m.origin?.backend==='model').length===2);
 await house.screenshot({path:path.join(out,'gather-arrived.png'),omitBackground:true,scale:'css'});
 await waitHouseState(house,s=>s.companionEvents.some(e=>e.trigger==='message'));
 // GPT must keep its approved video identity while physically moving.
 await send({type:'perform',id:'shiori',intent:{action:'walk',x:80,y:92,duration:2}});
 await house.waitForFunction(()=>document.querySelector('.house-resident[data-character=shiori]')?.dataset.moving==='true');
 assert.equal(await house.locator('.house-resident[data-character=shiori] .reaction-fallback').count(),0);
 assert.ok((await house.locator('.house-resident[data-character=shiori] video.cast-idle-video').getAttribute('src')).endsWith('idle-subject-s1-clean-v3.webm'));
 assert.deepEqual(errors,[]);
 const result={success:true,packaged,realPixelTravel:true,noSnapBack:true,overlapBelowHalf:true,modelGatherTwoResidents:true,speechAfterArrival:true,gptIdentityRetained:true,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await app.close();server.close();}
