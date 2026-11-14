// Local recording harness. No network listener, production setting or visible demo menu.
import {_electron as electron} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const option=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const scene=option('--scene','claude-affection');
const scenes={
 'claude-affection':{action:{type:'praise',id:'rin'},asset:'xia-reach-t1'},
 'gpt-affection':{action:{type:'praise',id:'shiori'},asset:'gpt-close-t1'},
 'shared-seat':{action:{type:'companion-story',id:'seat-share'},asset:undefined},
};
if(!scenes[scene])throw Error('Unknown --scene: '+scene);
const seconds=Number(option('--seconds','30'));
if(!Number.isFinite(seconds)||seconds<0||seconds>600)throw Error('--seconds must be 0..600');
const out=path.resolve('test-results',`recording-${Date.now()}`);fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,'profile')};delete env.ELECTRON_RUN_AS_NODE;
const packaged=process.argv.includes('--packaged'),version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const app=await electron.launch({...(packaged?{executablePath:path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`)}:{}),args:packaged?[`--user-data-dir=${env.GARDEN_TEST_DATA}`]:[process.cwd()],env});
try{
 await app.firstWindow();let page;
 for(let i=0;i<100&&!page;i++){page=app.windows().find(p=>p.url().includes('view=chat'));if(!page)await new Promise(r=>setTimeout(r,100));}
 assert.ok(page);
 assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),env.GARDEN_TEST_DATA);
 const send=a=>page.evaluate(a=>window.garden.dispatch(a),a);
 await send({type:'settings',patch:{mode:'demo',autonomous:false,dnd:false,pairRomance:true,cgAutoplay:true}});
 await send({type:'room-settings',patch:{autonomous:false,wandering:false}});
 const state=await page.evaluate(()=>window.garden.getState());
 await send({type:'relationship',...state.relationship,mode:'romance'});
 assert.equal(await page.locator('.tryplay-strip,.cg-preview-buttons,.cg-pair-trials,#social-scene,#yuri-scene').count(),0);
 await send(scenes[scene].action);
 await page.waitForFunction(()=>!!document.querySelector('.cg-moment,.cg-memory-chip'),null,{timeout:60000});
 if(await page.locator('.cg-memory-chip').count())await page.locator('.cg-memory-chip').click();
 await page.waitForFunction(()=>{const v=document.querySelector('.cg-moment video');return v&&v.readyState>=2&&!v.paused&&v.currentTime>.1;});
 const active=await page.evaluate(()=>window.garden.getState());
 assert.equal(active.cgSession?.automatic,true,'must originate from an interaction, not cg-preview');
 if(scenes[scene].asset)assert.equal(active.cgSession.asset,scenes[scene].asset);
 assert.equal(await page.locator('.cg-moment').count(),1);
 await page.screenshot({path:path.join(out,'scene.png'),scale:'css'});
 console.log(JSON.stringify({scene,asset:active.cgSession.asset,naturalTrigger:true,visibleDemoControls:false,packaged,profile:env.GARDEN_TEST_DATA}));
 await page.waitForTimeout(seconds*1000);
}finally{await app.close();}
