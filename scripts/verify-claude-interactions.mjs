import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const out=path.resolve('test-results/claude-interactions');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(out,`profile-${Date.now()}`)};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[process.cwd()],env});const errors=[];
try{
 await app.firstWindow();let main,overlay;
 for(let i=0;i<80&&(!main||!overlay);i++){main=app.windows().find(p=>p.url().includes('view=chat'));overlay=app.windows().find(p=>p.url().includes('view=pets')&&p.url().includes('primary=true'));if(!main||!overlay)await new Promise(r=>setTimeout(r,100));}
 for(const p of [main,overlay])p.on('pageerror',e=>errors.push(e.message));
 await main.evaluate(async()=>{await window.garden.dispatch({type:'settings',patch:{autonomous:false}});await window.garden.dispatch({type:'room-settings',patch:{autonomous:false,wandering:false}});});
 const room=main.locator('.room-character[data-character=rin] .claude-video-sprite');
 await room.locator('video').waitFor();
 const observed=[];
 async function ready(p,selector,clip){await p.waitForFunction(({selector,clip})=>{const e=document.querySelector(selector),v=e?.querySelector('video');return e?.dataset.clip===clip&&v?.readyState>=2&&!v.paused;},{selector,clip});}
 const selector='.room-character[data-character=rin] .claude-video-sprite';
 await ready(main,selector,'idle');
 const alpha=await room.locator('video').evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(v,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>230)opaque++;return{width:v.videoWidth,height:v.videoHeight,corners:[d[3],d[c.width*4-1],d[d.length-1]],opaque};});
 assert.deepEqual(alpha.corners,[0,0,0]);assert.ok(alpha.opaque>10000);
 await main.evaluate(()=>window.garden.dispatch({type:'pat',id:'rin'}));await ready(main,selector,'pat');await room.locator('.pat-hand').waitFor();
 await main.waitForTimeout(2100);await main.screenshot({path:path.join(out,'room-pat.png'),scale:'css'});observed.push('pat');
 await main.evaluate(()=>window.garden.dispatch({type:'feed',id:'rin',food:'rice'}));assert.equal(await room.getAttribute('data-clip'),'pat','new input does not cut off a running reaction');
 await ready(main,selector,'rice');assert.equal(await room.locator('.feed-dish').count(),0,'baked bowl is not duplicated');await main.waitForTimeout(2100);await main.screenshot({path:path.join(out,'room-rice.png'),scale:'css'});observed.push('rice');
 await ready(main,selector,'idle');await main.evaluate(()=>window.garden.dispatch({type:'praise',id:'rin'}));await ready(main,selector,'affection');await main.waitForTimeout(2000);await main.screenshot({path:path.join(out,'room-affection.png'),scale:'css'});observed.push('affection');await ready(main,selector,'idle');
 await main.evaluate(()=>window.garden.dispatch({type:'perform',id:'rin',intent:{action:'read',duration:7}}));await ready(main,selector,'bookmark');observed.push('bookmark');await ready(main,selector,'idle');
 await main.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock',chatForm:'chibi'}}));
 const pet=overlay.locator('.dock-pet[data-character=rin]'),box=await pet.locator('.pet-body').boundingBox();await overlay.mouse.move(box.x+box.width/2,box.y+box.height-12);
 await pet.getByTitle('和Claude私聊',{exact:true}).click();
 let privatePage;for(let i=0;i<70&&!privatePage;i++){privatePage=app.windows().find(p=>p.url().includes('view=private')&&p.url().includes('character=rin'));if(!privatePage)await new Promise(r=>setTimeout(r,100));}
 assert.ok(privatePage);await ready(privatePage,'.claude-video-sprite','chat');await privatePage.waitForTimeout(1700);await privatePage.screenshot({path:path.join(out,'private-chat.png'),scale:'css'});observed.push('chat');
 await overlay.waitForSelector('.dock-pet[data-character=rin] .claude-video-sprite[data-clip=chat]');await overlay.screenshot({path:path.join(out,'dock-chat.png'),omitBackground:true,scale:'css'});
 await main.evaluate(()=>window.garden.dispatch({type:'settings',patch:{dnd:true}}));await main.waitForTimeout(400);assert.ok(await room.locator('video').evaluate(v=>v.paused));
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({observed,alpha,errors,queuedReaction:true,dndStops:true},null,2));
 console.log('PASS Claude: actual five clips, transparent idle, complete reaction before next, no duplicate food, private selection and dock, DND.',observed);
}finally{await app.close();}
