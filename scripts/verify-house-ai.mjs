// Isolated local SSE fixture: exercises the real renderer / IPC / provider path, without API billing.
import {_electron as electron} from 'playwright';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {waitHouseState} from './house-test-helpers.mjs';

const out=path.resolve('test-results/house-ai-integration');
fs.mkdirSync(out,{recursive:true});
let fail=true;
const requests=[];
const server=http.createServer(async(req,res)=>{
 let data='';for await(const part of req)data+=part;
 const body=JSON.parse(data),system=body.messages?.[0]?.content??'';
 if(fail){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'fixture invalid key'}}));return;}
 let text='测试连接成功';
 if(system.includes('You direct a small shared home')){
  const event=JSON.parse(body.messages.at(-1).content),actor=event.actor??'xia';
  requests.push(event.kind);
  text=JSON.stringify({beats:[{actor,text:event.privateGreeting?'PRIVATE_FIXTURE_GREETING':'这次的'+event.kind+'我收到了，我们接着刚才的话题。',intent:{action:'shy',emotion:'happy',duration:2}},...(actor==='xia'?[{actor:'rin',text:'我也听见啦，给她留一点吧。',intent:{action:'wave',duration:2}}]:[])]});
 }
 res.writeHead(200,{'Content-Type':'text/event-stream'});
 res.end('data: '+JSON.stringify({choices:[{delta:{content:text}}]})+'\n\ndata: [DONE]\n\n');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const env={...process.env,GARDEN_TEST_DATA:path.join(out,'profile-'+Date.now()),GARDEN_TEST_HOUSE:'1'};
delete env.ELECTRON_RUN_AS_NODE;
const executablePath=process.argv.includes('--packaged')?path.resolve(`release/v${JSON.parse(fs.readFileSync('package.json','utf8')).version}/win-unpacked/团子小屋.exe`):undefined;
const app=await electron.launch({executablePath,args:executablePath?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
const errors=[];
try{
 await app.firstWindow();
 let house;
 for(let i=0;i<100&&!house;i++){house=app.windows().find(p=>p.url().includes('view=house'));if(!house)await new Promise(r=>setTimeout(r,100));}
 assert.ok(house);house.on('pageerror',e=>errors.push(e.message));
 await house.locator('.mini-frame').waitFor();
 await house.evaluate(()=>window.garden.dispatch({type:'settings',patch:{autonomous:false}}));
 await house.getByRole('button',{name:'设置与连接',exact:true}).click();
 const main=app.windows().find(p=>p.url().includes('view=settings'));
 const form=main.locator('.connections-page');
 await form.getByRole('button',{name:'AI 连接',exact:true}).click();
 await form.getByRole('button',{name:'DeepSeek',exact:true}).click();
 await form.getByRole('textbox',{name:'API 地址（完整地址或 Base URL）',exact:true}).fill('http://127.0.0.1:'+server.address().port+'/chat/completions');
 await form.getByRole('button',{name:/deepseek-flash/}).click();
 await form.getByLabel('API Key',{exact:true}).fill('fixture-key-only');
 await form.getByRole('button',{name:'连接并开始陪伴',exact:true}).click();
 await form.locator('.settings-notice').filter({hasText:/401/}).waitFor();
 assert.equal(await house.evaluate(async()=>(await window.garden.getState()).settings.mode),'demo');
 // The failed test still securely saved the key: reconnect with an empty input.
 assert.equal(await form.getByLabel('API Key',{exact:true}).inputValue(),'');
 fail=false;
 await form.getByRole('button',{name:'连接并开始陪伴',exact:true}).click();
 await waitHouseState(house,s=>s.settings.mode==='api');
 await house.getByRole('button',{name:'聊聊',exact:true}).click();
 await house.locator('.house-chat textarea').waitFor();
 await house.getByRole('button',{name:'摸摸',exact:true}).click();
 await waitHouseState(house,s=>s.messages.filter(m=>m.origin?.backend==='model').length===2);
 assert.ok(requests.includes('pat'));
 await house.screenshot({path:path.join(out,'live-pat.png'),omitBackground:true,scale:'css'});
 await house.getByRole('button',{name:'投喂',exact:true}).click();
 await house.getByRole('button',{name:'米饭',exact:true}).click();
 await waitHouseState(house,s=>s.messages.some(m=>m.origin?.backend==='model'&&m.text.includes('feed')));
 await house.getByRole('button',{name:'Claude',exact:true}).click();
 await waitHouseState(house,s=>s.privateMessages.rin.some(m=>m.origin?.backend==='model'));
 const state=await house.evaluate(()=>window.garden.getState());
 assert.ok(!state.messages.some(m=>m.text==='PRIVATE_FIXTURE_GREETING'));
 assert.deepEqual(errors,[]);
 const result={success:true,requests,connectFailureKeepsDemo:true,connectSuccessEnablesApi:true,savedKeyReused:true,privateIsolated:true,errors,mockedApi:true,packaged:!!executablePath};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await app.close();server.close();}
