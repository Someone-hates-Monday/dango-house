import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const env={...process.env,GARDEN_TEST_DATA:path.resolve('test-results',`v03-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[process.cwd()],env});const errors=[];
try{
 await app.firstWindow();let main,overlay;for(let i=0;i<100&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 for(const p of [main,overlay])p.on('pageerror',e=>errors.push(e.message));
 await main.waitForSelector('.room-character');await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{wandering:false,autonomous:false}});});
 await main.waitForFunction(()=>[...document.querySelectorAll('.rig-canvas')].filter(c=>c.dataset.motionTime).length>=5);
 const first=await main.locator('.room-character .rig-canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()));await main.waitForTimeout(850);const second=await main.locator('.room-character .rig-canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()));assert.equal(first.filter((v,i)=>v!==second[i]).length,5,'all five non-video characters breathe continuously');
 await main.waitForFunction(()=>{const v=document.querySelector('.room-character[data-character=rin] video');return v?.readyState>=2&&!v.paused;});
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'rin'}));await main.waitForSelector('.room-character[data-character=rin] .pat-hand');await main.screenshot({path:'test-results/v03-pat.png',scale:'css'});
 const saved=await main.evaluate(async()=>(await window.garden.getState()).pets);
 await main.getByRole('button',{name:'▁ 趴在任务栏',exact:true}).click();await overlay.waitForSelector('.dock-pet');assert.equal(await overlay.locator('.dock-pet').count(),7);
 await overlay.waitForFunction(()=>[...document.querySelectorAll('.dock-pet .rig-canvas')].every(c=>c.dataset.motionTime));
 const boxes=await overlay.locator('.dock-pet').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 await overlay.waitForTimeout(1200);const moved=await overlay.locator('.dock-pet').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y};}));for(let i=0;i<7;i++){assert.equal(boxes[i].y,moved[i].y);assert.equal(boxes[i].x,moved[i].x);}
 await overlay.screenshot({path:'test-results/v03-dock-rest.png',omitBackground:true,scale:'css'});
 const firstPet=overlay.locator('.dock-pet').first();const b=await firstPet.locator('.pet-body').boundingBox();await overlay.mouse.move(b.x+b.width/2,b.y+b.height-15);await overlay.waitForFunction(()=>document.querySelector('.dock-pet')?.getAttribute('data-awake')==='true');await firstPet.locator('.video-sprite').waitFor();
 await overlay.screenshot({path:'test-results/v03-dock-hover.png',omitBackground:true,scale:'css'});await overlay.mouse.move(5,5);await overlay.waitForTimeout(2300);assert.equal(await firstPet.getAttribute('data-awake'),'false');assert.ok(Number(await firstPet.locator('canvas').getAttribute('data-perch'))>.95);
 await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'free'}}));await overlay.waitForSelector('.desktop-pet:not(.dock-pet)');assert.deepEqual(await main.evaluate(async()=>(await window.garden.getState()).pets),saved);
 await main.getByRole('button',{name:/公馆群聊/}).click();await main.waitForSelector('.selected-art .portrait-stage img');await main.waitForFunction(()=>document.querySelector('.selected-art img')?.naturalWidth>0);await main.screenshot({path:'test-results/v03-portrait.png',scale:'css'});
 await main.getByLabel('聊天形象').selectOption('chibi');await main.waitForSelector('.selected-art .video-sprite');
 await main.evaluate(()=>window.garden.dispatch({type:'trip',id:'xia'}));await main.waitForTimeout(1600);assert.equal(await main.locator('.selected-art .video-sprite').getAttribute('data-motion-phase'),'trip-down');await main.waitForTimeout(2300);assert.equal(await main.locator('.selected-art .video-sprite').getAttribute('data-motion-phase'),'trip-recover');await main.waitForTimeout(3400);assert.ok(!String(await main.locator('.selected-art .video-sprite').getAttribute('data-motion-phase')).startsWith('trip-'));
 assert.deepEqual(errors,[]);console.log('PASS v0.3: five continuous rigs and Claude video, visible petting, seven dock residents, bounded drift, hover stand/rest, free-position restore, normal portrait, trip hold/recovery.');
}finally{await app.close();}
