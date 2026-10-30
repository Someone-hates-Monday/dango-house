// Capture the running application using an empty, offline profile. No user data or keys.
import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const out = path.join(root, 'docs', 'screenshots');
fs.mkdirSync(out, { recursive: true });
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const profile = path.join(root, 'test-results', `showcase-${Date.now()}`);
const app = await electron.launch({
  executablePath: path.join(root, `release/v${version}/win-unpacked/团子小屋.exe`),
  args: [`--user-data-dir=${profile}`], env,
});
try {
  await app.firstWindow();
  let main, overlay;
  for (let i = 0; i < 100 && (!main || !overlay); i++) {
    main = app.windows().find(p => p.url().includes('view=chat'));
    overlay = app.windows().find(p => p.url().includes('view=pets') && p.url().includes('primary=true'));
    if (!main || !overlay) await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(main && overlay);
  await main.waitForSelector('.room-character');
  await main.evaluate(async () => {
    await window.garden.dispatch({type:'settings', patch:{mode:'demo',autonomous:false,dnd:false,petsVisible:true}});
    await window.garden.dispatch({type:'room-settings', patch:{autonomous:false,wandering:false}});
  });
  await main.waitForTimeout(1800);
  await main.screenshot({path:path.join(out,'room.png'),scale:'css'});

  await main.locator('#social-scene').selectOption('bookmark');
  await main.getByRole('button',{name:'▶ 看这段互动',exact:true}).click();
  await main.waitForTimeout(5300);
  await main.screenshot({path:path.join(out,'social.png'),scale:'css'});

  await main.evaluate(() => window.garden.dispatch({type:'private-open',id:'rin'}));
  await main.waitForTimeout(5500);
  await main.screenshot({path:path.join(out,'rivalry.png'),scale:'css'});

  await main.evaluate(() => window.garden.openPrivate('rin'));
  let privatePage;
  for(let i=0;i<60&&!privatePage;i++) {
    privatePage=app.windows().find(p=>p.url().includes('view=private')&&p.url().includes('character=rin'));
    if(!privatePage)await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(privatePage);
  await privatePage.waitForSelector('.private-window');
  await privatePage.screenshot({path:path.join(out,'private.png'),scale:'css'});

  await main.evaluate(async () => {
    await window.garden.dispatch({type:'stop'});
    await window.garden.dispatch({type:'room-settings',patch:{wandering:false}});
    await window.garden.dispatch({type:'presentation',patch:{desktopMode:'dock'}});
  });
  await overlay.mouse.move(2,2);
  await overlay.waitForFunction(()=>document.querySelectorAll('.dock-pet.resting').length===7);
  await overlay.waitForTimeout(2500);
  const viewport = await overlay.evaluate(()=>({width:innerWidth,height:innerHeight}));
  const height=Math.min(112,viewport.height);
  const slots=await overlay.locator('.dock-pet').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right};}));
  const left=Math.max(0,Math.floor(Math.min(...slots.map(r=>r.left))-30));
  const right=Math.min(viewport.width,Math.ceil(Math.max(...slots.map(r=>r.right))+30));
  await overlay.screenshot({path:path.join(out,'dock.png'),omitBackground:true,scale:'css',clip:{x:left,y:viewport.height-height,width:right-left,height}});
  await main.getByRole('button',{name:'公馆群聊',exact:false}).click();
  await main.screenshot({path:path.join(out,'chat.png'),scale:'css'});
  console.log('Captured six real application screenshots with an offline, empty profile.');
} finally {
  await app.close();
}
