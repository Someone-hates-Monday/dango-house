import {_electron as electron} from 'playwright';import http from 'node:http';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';
const out=path.resolve('test-results/resident-dialogue');fs.mkdirSync(out,{recursive:true});const requests=[];
const server=http.createServer(async(req,res)=>{
 let raw='';for await(const part of req)raw+=part;const body=JSON.parse(raw),event=JSON.parse(body.messages.at(-1).content);requests.push(event);
 const plan=event.kind==='message'?{focus:'companions',beats:[
  {actor:'rin',text:'窗边的位置挺暖，你要一起坐吗？',audience:'companions',replyTo:'xia',intent:{action:'wave',emotion:'happy'}},
  {actor:'xia',text:'要呀！你坐哪边，我给你留点位置。',audience:'companions',replyTo:'rin',intent:{action:'shy',emotion:'happy'}},
 ]}:{beats:[{actor:'rin',text:'你这样夸我，我很开心。',audience:'user',intent:{action:'shy',emotion:'happy'}},
  ...(event.playfulRivalry?[{actor:'xia',text:'我也想一起玩呀，给我留个位置嘛。',audience:'user',intent:{action:'wave',emotion:'happy'}}]:[])]};
 res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify(plan)}}]})+'\n\ndata: [DONE]\n\n');
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const profile=path.join(out,'profile-'+Date.now()),env={...process.env,GARDEN_TEST_DATA:profile,GARDEN_TEST_HOUSE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${profile}`]:[process.cwd()],env});
try{
 await app.firstWindow();let house;for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(r=>setTimeout(r,100));}
 assert.ok(house);await house.locator('.mini-frame').waitFor();const errors=[];house.on('pageerror',e=>errors.push(e.message));
 const send=a=>house.evaluate(a=>window.garden.dispatch(a),a);
 await house.evaluate(async endpoint=>{await window.garden.saveKey('deepseek','fixture-only');await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'fixture',endpoint,tools:true}});await window.garden.dispatch({type:'settings',patch:{provider:'deepseek',model:'fixture',mode:'api',autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});},`http://127.0.0.1:${server.address().port}/chat/completions`);
 await house.waitForTimeout(500);
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=house')),original=w.setBounds.bind(w);globalThis.__speechResizes=0;w.setBounds=(...args)=>{globalThis.__speechResizes++;return original(...args);};});
 await send({type:'send',text:'Claude和大鱼，聊聊去窗边坐哪边吧。'});
 await waitHouseState(house,s=>s.messages.filter(m=>m.origin?.backend==='model').length===2);
 await house.locator('.house-resident-speech[data-speaker=xia][data-recipient=rin]').waitFor();
 assert.equal(await house.locator('.house-resident-speech').count(),2);
 assert.ok((await house.locator('.house-resident-speech[data-speaker=rin] small').innerText()).includes('DeepSeek'));
 assert.ok((await house.locator('.house-resident-speech[data-speaker=xia] small').innerText()).includes('Claude'));
 assert.equal(await house.locator('.house-resident[data-character=rin]').getAttribute('data-listening-to'),'xia');
 const rects=await house.locator('.house-resident-speech').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 assert.ok(rects[0].x+rects[0].w<=rects[1].x||rects[1].x+rects[1].w<=rects[0].x||rects[0].y+rects[0].h<=rects[1].y||rects[1].y+rects[1].h<=rects[0].y);
 const resizeCalls=await app.evaluate(()=>globalThis.__speechResizes);assert.equal(resizeCalls,0);
 await house.screenshot({path:path.join(out,'directed-bubbles.png'),omitBackground:true,scale:'css'});
 const beforeView=requests.length;await house.locator('.house-resident-speech[data-speaker=rin]').click();await house.locator('.house-chat').waitFor();assert.equal(requests.length,beforeView,'viewing a transcript must not start a new scene');
 assert.ok((await house.locator('.house-message-address').allTextContents()).some(t=>t.includes('DeepSeek')));
 const since=Date.now();await send({type:'praise',id:'rin'});
 const rivalry=await waitHouseState(house,s=>s.messages.some(m=>m.at>=since&&m.speaker==='xia'&&m.audience==='user'));
 assert.equal(requests.at(-1).playfulRivalry,true);assert.equal(rivalry.cgSession,undefined);
 await house.screenshot({path:path.join(out,'playful-rivalry.png'),omitBackground:true,scale:'css'});
 await send({type:'settings',patch:{playfulRivalry:false}});await house.waitForTimeout(1600);const offAt=Date.now();await send({type:'praise',id:'rin'});
 await waitHouseState(house,s=>s.messages.some(m=>m.at>=offAt&&m.speaker==='rin'));
 const final=await house.evaluate(()=>window.garden.getState());assert.equal(final.settings.playfulRivalry,false);assert.equal(requests.at(-1).playfulRivalry,false);assert.ok(!final.messages.some(m=>m.at>=offAt&&m.speaker==='xia'));
 assert.deepEqual(errors,[]);const report={success:true,packaged,separateOwnerBubbles:true,explicitRecipients:true,listenerHighlight:true,noBubbleOverlap:true,nativeResizes:resizeCalls,readingDoesNotInterrupt:true,modelRivalry:true,rivalryOffWorks:true,noPairCgFromPraise:true,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await app.close();server.close();}
