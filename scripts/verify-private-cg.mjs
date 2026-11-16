import {_electron as electron} from 'playwright';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';
const out=path.resolve('test-results/private-cg');fs.mkdirSync(out,{recursive:true});
const server=http.createServer(async(req,res)=>{
 let raw='';for await(const p of req)raw+=p;const b=JSON.parse(raw);let delta;
 if(b.messages.some(m=>m.role==='tool'))delta={content:'（向你伸手）来，靠近一点。'};
 else {assert.ok(b.tools.some(t=>t.function?.name==='request_cg'));delta={tool_calls:[{index:0,id:'cg-fixture',function:{name:'request_cg',arguments:'{"asset":"xia-reach-t1"}'}}]};}
 res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta}]})+'\n\ndata: [DONE]\n\n');
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version,packaged=process.argv.includes('--packaged'),profile=path.join(out,'profile-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
try{
 await app.firstWindow();let house;for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(r=>setTimeout(r,100));}assert.ok(house);await house.locator('.mini-frame').waitFor();
 const errors=[];house.on('pageerror',e=>errors.push(e.message));const send=a=>house.evaluate(a=>window.garden.dispatch(a),a);
 await house.evaluate(async endpoint=>{await window.garden.saveKey('deepseek','fixture-only');await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'fixture',endpoint,tools:true}});await window.garden.dispatch({type:'settings',patch:{mode:'api',provider:'deepseek',model:'fixture',autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});await window.garden.dispatch({type:'relationship',mode:'romance',userName:'你',address:'你'});},`http://127.0.0.1:${server.address().port}`);
 await send({type:'private-send',id:'rin',text:'PRIVATE_CG_SECRET Claude，抱抱我吧。'});
 const playing=await waitHouseState(house,s=>s.cgSession?.asset==='xia-reach-t1',25000);assert.ok(!playing.messages.some(m=>m.text.includes('PRIVATE_CG_SECRET')));
 await house.locator('.house-cg video').waitFor();assert.equal(await house.locator('.house-cg').count(),1);
 await house.waitForFunction(()=>{const v=document.querySelector('.house-cg video');return v?.readyState>=2&&v.currentTime>0;});
 await house.screenshot({path:path.join(out,'private-cg-playing.png'),omitBackground:true,scale:'css'});
 await send({type:'settings',patch:{cgAutoplay:false}});await waitHouseState(house,s=>!s.cgSession);await send({type:'private-send',id:'rin',text:'再抱抱我'});
 const blocked=await waitHouseState(house,s=>s.privateMessages.rin.some(m=>m.speaker==='system'&&m.text.includes('剧情短片')));assert.equal(blocked.cgSession,undefined);assert.ok(blocked.privateMessages.rin.some(m=>m.speaker==='system'&&m.text.includes('剧情短片')));
 assert.deepEqual(errors,[]);const report={success:true,packaged,privateToolThroughMain:true,decodedPlayback:true,singlePlayer:true,privateIsolated:true,visibleBlockedReason:true,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await app.close();server.close();}
