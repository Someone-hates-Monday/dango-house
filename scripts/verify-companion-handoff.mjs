import {_electron as electron} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';

const out=path.resolve('test-results/companion-handoff');fs.mkdirSync(out,{recursive:true});
const requests=[];
const server=http.createServer(async(req,res)=>{
 let raw='';for await(const part of req)raw+=part;const body=JSON.parse(raw),system=body.messages[0].content;
 let delta;
 if(system.startsWith('You direct a small shared home')){
  assert.ok(!system.includes('PRIVATE_FIXTURE_SECRET'),'private transcript must not enter the shared planner');
  const event=JSON.parse(body.messages.at(-1).content);requests.push(event.kind);
  const plan=event.kind==='private-open'?{beats:[{actor:'rin',text:'你来啦。',intent:{action:'shy'}}]}:{focus:'companions',playMode:'self-play',beats:[
   {actor:'rin',text:'好，那我去找她。',stay:true,intent:{action:'wave',duration:1}},
   {actor:'rin',text:'大鱼，来一起待会儿。',intent:{action:'approach',target:'xia',duration:1,emotion:'happy'}},
   {actor:'xia',text:'好呀，挨着你。',replyTo:'rin',intent:{action:'shy',duration:1,emotion:'happy'}},
  ],cgAsset:'rin-xia-cheek-t1'};
  delta={content:JSON.stringify(plan)};
 }else if(body.messages.some(m=>m.role==='tool')){delta={content:'好，我去找大鱼待会儿，你安心忙。'};}
 else {assert.ok(body.tools.some(t=>t.function?.name==='invite_companion'));requests.push('private-invite-tool');delta={tool_calls:[{index:0,id:'invite-test',function:{name:'invite_companion',arguments:JSON.stringify({target:'xia',topic:'一起靠近待会儿',playMode:'self-play'})}}]};}
 res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta}]})+'\n\ndata: [DONE]\n\n');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version,checks=[];
try{for(const channel of ['public','private']){
 const profile=path.join(out,channel+'-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
 try{
  await app.firstWindow();let house;for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(house);await house.locator('.house-scene').waitFor();const errors=[];house.on('pageerror',e=>errors.push(e.message));
  const send=a=>house.evaluate(a=>window.garden.dispatch(a),a);
  await send({type:'settings',patch:{autonomous:false}});await send({type:'room-settings',patch:{autonomous:false,wandering:false}});
  await house.evaluate(()=>window.garden.houseLayout({width:500,height:400,chatOpen:false,cgHeight:280}));
  await send({type:'perform',id:'rin',intent:{action:'walk',x:channel==='private'?10:85,y:channel==='private'?50:92,duration:1}});
  await waitHouseState(house,s=>!s.room.residents.rin.arrivesAt);
  await house.evaluate(async endpoint=>{await window.garden.saveKey('deepseek','fixture-only');await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'fixture',endpoint,tools:true}});await window.garden.dispatch({type:'settings',patch:{provider:'deepseek',model:'fixture',mode:'api'}});},`http://127.0.0.1:${server.address().port}/chat/completions`);
  if(channel==='private'){
   const hit=await house.locator('.house-resident[data-character=rin]').evaluate(el=>{const r=el.getBoundingClientRect();for(const fy of [.5,.2,.8])for(const fx of [.5,.2,.8]){const x=r.x+r.width*fx,y=r.y+r.height*fy;if(document.elementFromPoint(x,y)?.closest('.house-resident')===el)return{x,y};}});assert.ok(hit,'Claude must have a visible clickable area');await house.mouse.click(hit.x,hit.y);
   await waitHouseState(house,s=>s.companionEvents.some(e=>e.trigger==='private-open'));
   await house.locator('.house-chat textarea').fill('PRIVATE_FIXTURE_SECRET。Claude，去找大肥鱼玩吧，我有事你们自己玩。');
   await house.getByRole('button',{name:'发送',exact:true}).click();
  }else await send({type:'send',text:'Claude怎么不找大肥鱼玩？我想看你们亲近。'});
  await house.waitForFunction(()=>['rin','xia'].some(id=>document.querySelector('.house-resident[data-character='+id+']')?.dataset.moving==='true'));
  const moving=await house.evaluate(()=>window.garden.getState());assert.equal(moving.cgSession,undefined,'CG waits for approach and exchange');
  await house.screenshot({path:path.join(out,channel+'-walking.png'),omitBackground:true,scale:'css'});
  const state=await waitHouseState(house,s=>s.cgSession?.asset==='rin-xia-cheek-t1',45000);
  assert.equal(state.settings.housePlayMode,'self-play');assert.equal(await house.locator('.house-brain-status').innerText(),'她们自己玩');
  assert.ok(state.messages.some(m=>m.speaker==='xia'&&m.origin?.backend==='model'));
  assert.ok(!state.messages.some(m=>m.text.includes('PRIVATE_FIXTURE_SECRET')));
  await house.locator('.house-cg video').waitFor();assert.equal(await house.locator('.house-cg').count(),1);
  if(channel==='private')assert.ok(state.privateMessages.rin.some(m=>m.speaker==='rin'&&m.text==='好，我去找大鱼待会儿，你安心忙。'));
  assert.deepEqual(errors,[]);await house.screenshot({path:path.join(out,channel+'-shared-cg.png'),omitBackground:true,scale:'css'});
  checks.push({channel,actualApproach:true,modelPartnerReply:true,selfPlay:true,singleSharedCg:true,privateIsolated:true,errors});
 }finally{await app.close();}
}}finally{server.close();}
const report={success:true,packaged,checks,requests};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
