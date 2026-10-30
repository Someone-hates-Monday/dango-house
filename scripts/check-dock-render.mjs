import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'test-results','dock-v032');fs.mkdirSync(out,{recursive:true});
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
for(const scale of process.argv.includes('--packaged')?[1.25]:[1.25,1.5]){
 const data=path.join(out,`profile-${scale}-${Date.now()}`),env={...process.env,GARDEN_TEST_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch(process.argv.includes('--packaged')?{executablePath:path.join(root,`release/v${version}/win-unpacked/团子小屋.exe`),args:[`--user-data-dir=${data}`,`--force-device-scale-factor=${scale}`],env}:{args:[root,`--force-device-scale-factor=${scale}`],env});
 try{
  await app.firstWindow();let main,overlay;
  for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
  assert.ok(main&&overlay);await main.waitForSelector('.room-character');
  await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{wandering:false,autonomous:false}});});
  await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock'}}));
  await overlay.addInitScript(()=>{
   window.rigDrawAudit={sliced:0,whole:0};const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.matches('.rig-canvas')){if(a.length===9&&a[4]<=8)window.rigDrawAudit.sliced++;else window.rigDrawAudit.whole++;}return draw.apply(this,a);};
  });
  await overlay.reload();await overlay.mouse.move(5,5);
  await overlay.waitForFunction(()=>document.querySelectorAll('.dock-pet.resting').length===7&&[...document.querySelectorAll('.dock-pet canvas.rig-canvas')].every(c=>Number(c.dataset.perch)>.999&&!c.dataset.error));
  await overlay.waitForTimeout(700);
  const positions=()=>overlay.locator('.dock-pet').evaluateAll(ns=>ns.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));
  const before=await positions();await overlay.waitForTimeout(1400);assert.deepEqual(await positions(),before,'dock does not drift');
  const contacts=await overlay.locator('.dock-pet canvas.rig-canvas').evaluateAll(cs=>cs.map(c=>{
   const r=c.getBoundingClientRect(),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let bottom=0;
   for(let y=0;y<c.height;y++){let pixels=0;for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>96)pixels++;if(pixels>4)bottom=y;}
   return {id:c.closest('.dock-pet').dataset.character,bottom:r.y+(bottom+1)/c.height*r.height,gap:innerHeight-(r.y+(bottom+1)/c.height*r.height)};
  }));
  fs.writeFileSync(path.join(out,`contacts-${scale}.json`),JSON.stringify(contacts,null,2));console.log(scale,contacts);
  assert.ok(Math.max(...contacts.map(c=>c.bottom))-Math.min(...contacts.map(c=>c.bottom))<3,'all seven contact lines agree within 3 CSS pixels');
  assert.ok(contacts.every(c=>Math.abs(c.gap)<1.5),'contact lines sit on the work-area edge');
  const audit=await overlay.evaluate(()=>window.rigDrawAudit);assert.equal(audit.sliced,0);assert.ok(audit.whole>100);
  await overlay.screenshot({path:path.join(out,`rest-${scale}.png`),omitBackground:true,scale:'css'});
  const pet=overlay.locator('.dock-pet[data-character=xia]'),box=await pet.locator('.pet-body').boundingBox();
  await overlay.mouse.move(box.x+box.width/2,box.y+box.height-12);await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=xia]')?.dataset.awake==='true');
  assert.deepEqual(await positions(),before,'hover does not move slots');
  await pet.locator('.video-sprite video').waitFor();
  const pat=pet.getByTitle('摸摸头',{exact:true}),target=await pat.boundingBox();
  assert.ok(target.width>=32&&target.height>=32,'large toolbar targets');
  await overlay.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:14});
  await overlay.waitForTimeout(350);await pat.click();
  await pet.locator('.pat-hand').waitFor();await pet.locator('.video-sprite[data-clip=shy]').waitFor();
  const video=pet.locator('video');await video.waitFor({state:'visible'});
  await overlay.waitForFunction(()=>{const v=document.querySelector('.dock-pet[data-character=xia] video');return v?.readyState>=2&&!v.paused;});
  const time=await video.evaluate(v=>v.currentTime);await overlay.waitForTimeout(400);assert.ok(await video.evaluate(v=>v.currentTime)>time,'full video advances after petting');
  await pet.getByTitle('投喂大米饭',{exact:true}).click();
  await video.evaluate(v=>v.currentTime=v.duration-.05);
  await pet.locator('.video-sprite[data-clip=rice]').waitFor();
  await overlay.waitForFunction(()=>document.querySelector('.dock-pet[data-character=xia] video')?.readyState>=2);
  await pet.getByTitle('打招呼',{exact:true}).click();
  await video.evaluate(v=>v.currentTime=v.duration-.05);
  await pet.locator('.video-sprite[data-clip=wave]').waitFor();
  await overlay.screenshot({path:path.join(out,`awake-${scale}.png`),omitBackground:true,scale:'css'});
  assert.deepEqual(await positions(),before,'interaction has no displacement');
  for(const id of ['rin','shiori','gemini','glm','kimi','grok']){
   await main.evaluate(id=>window.garden.dispatch({type:'perform',id,intent:{action:'read',duration:8}}),id);
   await overlay.locator(`.dock-pet[data-character=${id}][data-awake=true] .sprite[aria-label$="read"]`).waitFor();
  }
  await pet.getByTitle('和DeepSeek私聊',{exact:true}).click();
  let privatePage;
  for(let i=0;i<80&&!privatePage;i++){privatePage=app.windows().find(p=>p.url().includes('view=private')&&p.url().includes('character=xia'));if(!privatePage)await new Promise(r=>setTimeout(r,100));}
  assert.ok(privatePage);await privatePage.waitForSelector('.private-window');await privatePage.getByRole('button',{name:'关闭私聊'}).click();
  await main.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));
  await overlay.mouse.move(5,5);await overlay.waitForTimeout(2500);assert.deepEqual(await positions(),before);
  await pet.locator('canvas.rig-canvas').waitFor();
  console.log(`PASS ${scale}: seven aligned contact lines, no drift, hover works, no segmented texture draws.`);
 }finally{await app.close();}
}
