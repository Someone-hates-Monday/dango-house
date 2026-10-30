import { _electron as electron } from 'playwright';
import path from 'node:path';
import assert from 'node:assert/strict';
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ executablePath: path.resolve('release/win-unpacked/栖庭.exe'), env, timeout: 30000 });
try {
  await app.firstWindow(); let page;
  for(let i=0;i<100 && !page;i++){ page=app.windows().find(w=>w.url().includes('view=chat')); if(!page) await new Promise(resolve=>setTimeout(resolve,100)); }
  assert.ok(page); await page.waitForSelector('.app-shell');
  await page.waitForFunction(()=>[...document.querySelectorAll('img.sprite')].every(img=>img.complete && img.naturalWidth>0));
  assert.equal(await app.evaluate(({app})=>app.isPackaged),true);
  assert.equal(await page.locator('.stage-pet').count(),3);
  assert.equal(await page.getByLabel('外观样式',{exact:true}).locator('option').count(),2);
  await page.screenshot({path:'test-results/packaged-app.png',scale:'css'});
  console.log('PASS: packaged application starts and loads all community character art.');
} finally { await app.close(); }
