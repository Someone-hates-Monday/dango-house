// Explicit live test: uses the application's existing encrypted credential.
// Never print/decrypt the key in this script or copy it into a report.
import {_electron as electron} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const appData=path.join(process.env.APPDATA,'Qiting');
const profile=path.join(appData,'live-api-tests',String(Date.now()));fs.mkdirSync(profile,{recursive:true});
const encrypted=JSON.parse(fs.readFileSync(path.join(appData,'credentials.json'),'utf8'));
assert.ok(encrypted.deepseek,'Save DeepSeek in the application first.');
fs.writeFileSync(path.join(profile,'credentials.json'),JSON.stringify({deepseek:encrypted.deepseek}));
// Chromium's encrypted master key is profile-local; keep DPAPI protection intact.
const localState=JSON.parse(fs.readFileSync(path.join(appData,'Local State'),'utf8'));
fs.writeFileSync(path.join(profile,'Local State'),JSON.stringify({os_crypt:localState.os_crypt}));
const out=path.resolve('test-results/live-deepseek');fs.mkdirSync(out,{recursive:true});
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`),args:[`--user-data-dir=${profile}`],env});
const report={provider:'deepseek',model:'deepseek-flash',isolatedConversation:true,keyPrinted:false,turns:[],errors:[]};
try{
 await app.firstWindow();assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),path.resolve(profile));
 // Observe request counts/status only, with a hard cap. No headers or credentials.
 await app.evaluate(()=>{globalThis.liveApiAudit=[];const original=globalThis.fetch;globalThis.fetch=async(...args)=>{
  const url=String(args[0]);if(new URL(url).hostname!=='api.deepseek.com')throw Error('Unexpected live-test destination');
  if(globalThis.liveApiAudit.length>=7)throw Error('Live-test request limit reached');
  const payload=JSON.parse(args[1]?.body??'{}'),entry={host:'api.deepseek.com',model:payload.model,tools:!!payload.tools,status:null};globalThis.liveApiAudit.push(entry);
  const response=await original(...args);entry.status=response.status;return response;
 };});
 let main,overlay;for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 assert.ok(main);assert.ok(overlay);main.on('pageerror',e=>report.errors.push(e.message));
 await main.evaluate(async()=>{
  await window.garden.dispatch({type:'settings',patch:{autonomous:false}});
  await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});
  await window.garden.dispatch({type:'connection',provider:'deepseek',profile:{model:'deepseek-flash',endpoint:'https://api.deepseek.com/chat/completions',tools:true}});
  await window.garden.dispatch({type:'settings',patch:{mode:'api',provider:'deepseek',model:'deepseek-flash',petsVisible:true,dnd:false}});
  await window.garden.dispatch({type:'presentation',patch:{desktopMode:'free',chatForm:'chibi'}});
  window.garden.openPrivate('shiori');
 });
 let privatePage;for(let i=0;i<100&&!privatePage;i++){privatePage=app.windows().find(p=>p.url().includes('view=private')&&p.url().includes('character=shiori'));if(!privatePage)await new Promise(r=>setTimeout(r,100));}
 assert.ok(privatePage);privatePage.on('pageerror',e=>report.errors.push(e.message));
 async function turn(prompt,action){
  const before=await main.evaluate(async()=>{const s=await window.garden.getState();return{messages:s.privateMessages.shiori.length,log:s.room.log.map(e=>e.id)};});
  await main.evaluate(text=>window.garden.dispatch({type:'private-send',id:'shiori',text: text}),prompt);
  let complete=false;
  for(const deadline=Date.now()+120000;Date.now()<deadline;){
   complete=await main.evaluate(async prompt=>{const s=await window.garden.getState(),messages=s.privateMessages.shiori,index=messages.findLastIndex(m=>m.speaker==='user'&&m.text===prompt);return index>=0&&!s.busy&&messages.slice(index+1).some(m=>m.text.trim()&&(m.speaker==='shiori'||m.speaker==='system'));},prompt);
   if(complete)break;
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.ok(complete,'Timed out awaiting the real API reply');
  const result=await main.evaluate(async({before,prompt})=>{const s=await window.garden.getState(),messages=s.privateMessages.shiori,index=messages.findLastIndex(m=>m.speaker==='user'&&m.text===prompt);return{messages:messages.slice(index+1),actions:s.room.log.filter(e=>!before.log.includes(e.id)&&e.actor==='shiori'&&e.source==='model'),body:{pose:s.bodies.shiori.pose,label:s.bodies.shiori.label},destination:s.room.residents.shiori.destination};},{before,prompt});
  report.lastObservedTurn=result;
  const errors=result.messages.filter(m=>m.speaker==='system');assert.equal(errors.length,0,errors.map(m=>m.text).join('; '));
  const reply=result.messages.filter(m=>m.speaker==='shiori').map(m=>m.text).join('');assert.ok(reply.trim(),'Real model must return spoken text');
  if(action)assert.ok(result.actions.length>0,'Expected a real model action tool result');
  report.turns.push({prompt,reply,actions:result.actions.map(e=>({text:e.text,source:e.source})),body:result.body,destination:result.destination});
  console.log(JSON.stringify({turn:report.turns.length,reply,modelActions:result.actions.length}));
  await privatePage.screenshot({path:path.join(out,`turn-${report.turns.length}.png`),scale:'css'});
 }
 await turn('GPT，先只用一句简短中文，以你这位白龙少女的性格向我打个招呼。这一轮不用做动作。',false);
 await turn('现在请真实调用一次 perform_action，让你自己挥挥手，保持6秒，再用一句话回应。不要只在文字里描述动作，不要调用其他动作。',true);
 await main.screenshot({path:path.join(out,'room-tool-action.png'),scale:'css'});await overlay.screenshot({path:path.join(out,'desktop-tool-action.png'),omitBackground:true,scale:'css'});
 await turn('再测试一次：请真实调用一次 perform_action，走到小屋的茶桌旁，动作持续8秒；之后简短告诉我你到了。不要只写文字，不要操作其他伙伴。',true);
 assert.deepEqual(report.errors,[]);report.requests=await app.evaluate(()=>globalThis.liveApiAudit);assert.ok(report.requests.every(r=>r.status===200));report.success=true;
 console.log('PASS live DeepSeek: real streaming replies and GPT avatar tool calls.');
}catch(error){report.success=false;report.failure=String(error.message);console.error('Live test failed:',error.message);process.exitCode=1;}
finally{report.requests=await app.evaluate(()=>globalThis.liveApiAudit).catch(()=>[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await app.close();for(const file of ['credentials.json','Local State'])fs.rmSync(path.join(profile,file),{force:true});}
