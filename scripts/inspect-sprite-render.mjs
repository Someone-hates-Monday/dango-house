import {_electron as electron} from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const data=path.resolve('test-results',`sprites-${Date.now()}`);fs.mkdirSync(data,{recursive:true});const env={...process.env,GARDEN_TEST_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:[process.cwd()],env});
try{await app.firstWindow();let page;for(let i=0;i<60&&!page;i++){page=app.windows().find(w=>w.url().includes('view=chat'));if(!page)await new Promise(r=>setTimeout(r,100));}await page.waitForSelector('.room-character');
console.log(await page.locator('.sprite.atlas').evaluateAll(nodes=>nodes.slice(0,16).map(n=>{const c=getComputedStyle(n);return {name:n.getAttribute('aria-label'),width:c.width,height:c.height,ratio:c.aspectRatio,size:c.backgroundSize,position:c.backgroundPosition,padding:c.padding,display:c.display};})));
for(const file of ['grok','claude','deepseek','gpt','gemini','kimi']){
await page.evaluate((file)=>{document.body.innerHTML='';document.body.style.cssText='display:block;height:auto;overflow:auto;background:#eee8ec';document.documentElement.style.cssText='height:auto;overflow:auto';const sheet=document.createElement('div');sheet.style.cssText='background:#eee8ec;padding:10px;display:grid;grid-template-columns:repeat(8,1fr);gap:4px';for(let row=0;row<9;row++)for(let col=0;col<8;col++){const el=document.createElement('div');el.innerHTML=`<div>${row}:${col}</div><svg viewBox="${col*192} ${row*208} 192 208" width="145" height="157" style="background:#fff5eb;overflow:hidden"><image href="./animated/${file}.webp" width="1536" height="2288"/></svg>`;sheet.append(el);}document.body.append(sheet);},file);await page.screenshot({path:`test-results/source-${file}.png`,scale:'css',fullPage:true});}
}finally{await app.close();}
