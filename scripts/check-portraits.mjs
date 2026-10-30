import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
const root=process.cwd(), output=path.join(root,'test-results','portraits-v031');
fs.mkdirSync(output,{recursive:true});
const env={...process.env,GARDEN_TEST_DATA:path.join(output,`profile-${Date.now()}`)};
delete env.ELECTRON_RUN_AS_NODE;
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const packaged=process.argv.includes('--packaged');
const app=await electron.launch(packaged?{executablePath:path.join(root,`release/v${version}/win-unpacked/团子小屋.exe`),args:[`--user-data-dir=${env.GARDEN_TEST_DATA}`],env}:{args:[root],env});
const cast={xia:'deepseek',rin:'claude',shiori:'gpt',gemini:'gemini',glm:'glm',kimi:'kimi',grok:'grok'};
try{
  await app.firstWindow();
  let page;
  for(let i=0;i<100&&!page;i++){page=app.windows().find(p=>p.url().includes('view=chat'));if(!page)await new Promise(r=>setTimeout(r,100));}
  assert.ok(page);await page.waitForSelector('.app-shell');
  await page.getByRole('button',{name:'公馆群聊',exact:false}).click();
  await page.evaluate(()=>window.garden.dispatch({type:'presentation',patch:{chatForm:'portrait'}}));
  for(const [id,file] of Object.entries(cast)){
    await page.evaluate(id=>window.garden.dispatch({type:'select',id}),id);
    await page.waitForFunction(file=>{const im=document.querySelector('.selected-art .portrait-stage img');return im?.src.endsWith(`${file}-alpha-v1.png`)&&im.complete&&im.naturalWidth>0;},file);
    const result=await page.locator('.selected-art img').evaluate(im=>{
      const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
      const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let clear=0,solid=0,white=0;
      for(let i=0;i<p.length;i+=4){if(p[i+3]===0)clear++;if(p[i+3]>=250)solid++;if(p[i]>225&&p[i+1]>225&&p[i+2]>225&&p[i+3]>=250)white++;}
      return {corners:[p[3],p[canvas.width*4-1],p[p.length-1],p[p.length-canvas.width*4+3]],clear:clear/(p.length/4),solid,white,blend:getComputedStyle(im).mixBlendMode};
    });
    console.log(file, result);
    assert.deepEqual(result.corners,[0,0,0,0]);assert.ok(result.clear>.2&&result.clear<.9);assert.ok(result.solid>10000);assert.ok(result.white>500);assert.equal(result.blend,'normal');
    for(const [name,color] of [['light','#f6eaf2'],['dark','#242130']]){
      const backdrop=await page.addStyleTag({content:`.selected-art{background:${color}!important}`});
      assert.equal(await page.locator('.selected-art').evaluate(el=>getComputedStyle(el).backgroundColor),name==='dark'?'rgb(36, 33, 48)':'rgb(246, 234, 242)');
      await page.locator('.selected-art').screenshot({path:path.join(output,`${file}-${name}.png`)});
      await backdrop.evaluate(el=>el.remove());
    }
    await page.evaluate(id=>window.garden.openPrivate(id),id);
    let privatePage;
    for(let i=0;i<80&&!privatePage;i++){privatePage=app.windows().find(p=>p.url().includes('view=private')&&p.url().includes(`character=${id}`));if(!privatePage)await new Promise(r=>setTimeout(r,100));}
    assert.ok(privatePage,`private window for ${id}`);
    await privatePage.waitForFunction(file=>{const im=document.querySelector('.private-hero .portrait-stage img');return im?.src.endsWith(`${file}-alpha-v1.png`)&&im.complete&&im.naturalWidth>0;},file);
    await privatePage.locator('.private-hero').screenshot({path:path.join(output,`${file}-private.png`)});
    await privatePage.getByRole('button',{name:'关闭私聊'}).click();
    console.log(`PASS ${file}: real alpha, opaque pale details, normal blending, group and private portrait`);
  }
}finally{await app.close();}
