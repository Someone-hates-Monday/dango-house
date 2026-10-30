import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd(); const data = path.join(root, 'test-results', `profile-${Date.now()}`);
fs.mkdirSync(data, { recursive: true });
const env = { ...process.env, GARDEN_TEST_DATA: data }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ args: [root], env, timeout: 30000 });
app.process().stderr?.on('data', data => process.stderr.write(data));
const failures = [];
async function untilState(page, predicate) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const snapshot = await page.evaluate(() => window.garden.getState());
    if (predicate(snapshot)) return snapshot;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('State predicate timed out');
}
try {
  await app.firstWindow();
  let page;
  for (let attempt = 0; attempt < 100 && !page; attempt++) { page = app.windows().find(w => w.url().includes('view=chat')); if (!page) await new Promise(resolve => setTimeout(resolve, 100)); }
  if (!page) throw new Error(`No chat window: ${app.windows().map(w => w.url()).join(', ')}`);
  page.on('console', message => { if (message.type() === 'error') console.error('Renderer:', message.text()); });
  page.on('pageerror', error => failures.push(error.message));
  try { await page.waitForSelector('.app-shell', { timeout: 10000 }); } catch (error) { console.log('DOM:', await page.locator('body').innerText(), failures); await page.screenshot({ path: 'test-results/launch-error.png' }); throw error; }
  await page.waitForFunction(() => [...document.querySelectorAll('img.sprite')].every(img => img.complete && img.naturalWidth > 0));

  assert.equal(await page.locator('.room-character').count(),7);
  await page.getByRole('button',{name:'挥挥手',exact:true}).click();
  await untilState(page,s=>s.bodies.xia.pose==='wave');
  await page.waitForFunction(()=>document.querySelector('.room-character.selected .atlas')?.getAttribute('data-row')==='3');
  await page.getByRole('button',{name:'开心跳跳',exact:true}).click();
  await untilState(page,s=>s.bodies.xia.pose==='jump');
  const affection=(await page.evaluate(()=>window.garden.getState())).affection.xia;
  await page.getByRole('button',{name:'摸摸头',exact:true}).click();
  await page.getByRole('button',{name:'🍚 大米饭',exact:true}).click();
  await untilState(page,s=>s.affection.xia===affection+6);
  await page.getByRole('button',{name:'布置小屋',exact:true}).click();
  await page.getByRole('button',{name:'放进小屋',exact:true}).click();
  await untilState(page,s=>s.room.furniture.length===7);
  await page.getByRole('button',{name:'完成布置',exact:true}).click();
  await page.locator('#social-scene').selectOption('cat-fox');
  await page.getByRole('button',{name:'▶ 看这段互动',exact:true}).click();
  await untilState(page,s=>s.bodies.gemini.bubble.includes('账本'));
  await page.screenshot({path:'test-results/dango-room.png',scale:'css'});
  await page.getByRole('button',{name:'只和她聊',exact:true}).click();
  let privatePage;
  for(let i=0;i<60&&!privatePage;i++){privatePage=app.windows().find(w=>w.url().includes('view=private'));if(!privatePage)await new Promise(r=>setTimeout(r,100));}
  assert.ok(privatePage);await privatePage.waitForSelector('.private-window');
  await privatePage.getByRole('textbox',{name:'私聊消息'}).fill('私聊冒烟测试');
  await privatePage.getByRole('button',{name:'发送私聊',exact:true}).click();
  await untilState(privatePage,s=>!s.busy&&s.privateMessages.xia.some(m=>m.text==='私聊冒烟测试')&&s.privateMessages.xia.at(-1).speaker==='xia');
  assert.equal((await page.evaluate(()=>window.garden.getState())).messages.some(m=>m.text==='私聊冒烟测试'),false);
  await privatePage.screenshot({path:'test-results/dango-private.png',scale:'css'});
  await privatePage.getByRole('button',{name:'关闭私聊'}).click();
  await page.getByRole('button',{name:'公馆群聊',exact:false}).click();
  await page.screenshot({ path: 'test-results/garden-chat.png', scale: 'css' });
  await page.getByLabel('外观样式', { exact: true }).selectOption('animated');
  await untilState(page, s => s.skins.xia === 'animated');
  await page.getByLabel('聊天形象').selectOption('chibi');const atlas = page.locator('.selected-art .atlas'); await atlas.waitFor();
  await page.evaluate(()=>window.garden.dispatch({type:'perform',id:'xia',intent:{action:'wave'}}));
  const firstFrame = await atlas.getAttribute('data-frame');
  for (let i = 0; i < 20 && await atlas.getAttribute('data-frame') === firstFrame; i++) await new Promise(resolve => setTimeout(resolve, 80));
  assert.notEqual(await atlas.getAttribute('data-frame'), firstFrame);
  await page.screenshot({ path: 'test-results/garden-animated.png', scale: 'css' });
  await page.getByRole('textbox', { name: '发送消息' }).fill('@Claude 你好');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await untilState(page, s => !s.busy && s.messages.at(-1).speaker === 'rin');
  assert.equal(await page.evaluate(async () => (await window.garden.getState()).messages.at(-1).speaker), 'rin');
  const beforePraise=(await page.evaluate(()=>window.garden.getState())).affection.xia;
  await page.getByRole('button', { name: '夸夸DeepSeek' }).first().click();
  await untilState(page, s => !s.busy && s.affection.xia >= beforePraise+3);
  assert.ok((await page.evaluate(()=>window.garden.getState())).affection.xia>=beforePraise+3);
  await page.getByRole('button', { name: '一起专注 25 分钟' }).click();
  await page.waitForSelector('.focus-banner');
  assert.ok(await page.evaluate(async () => (await window.garden.getState()).focus));
  await page.getByRole('button', { name: '结束计时' }).click();
  await untilState(page, s => !s.focus && !s.busy);
  await page.getByRole('switch', { name: '免打扰', exact: true }).click();
  await untilState(page, s => s.settings.dnd);
  assert.equal(await page.evaluate(async () => (await window.garden.getState()).settings.dnd), true);
  await page.getByRole('button', { name: '共同记忆' }).click();
  await page.getByRole('textbox', { name: '新的共同记忆' }).fill('测试：喜欢安静的雨天');
  await page.getByRole('button', { name: '记住这件事' }).click();
  await untilState(page, s => s.memories.length === 1);
  await page.getByRole('button', { name: '连接与偏好' }).click();
  await page.waitForSelector('.connections-page');
  await page.screenshot({ path: 'test-results/garden-settings.png' });
  await page.evaluate(async () => { await window.garden.saveKey('deepseek', 'test-not-a-real-secret'); });
  const credentials = fs.readFileSync(path.join(data, 'credentials.json'), 'utf8');
  assert.equal(credentials.includes('test-not-a-real-secret'), false);
  await page.evaluate(async () => window.garden.saveKey('deepseek', ''));
  const overlays = app.windows().filter(window => window.url().includes('view=pets'));
  assert.ok(overlays.length > 0, 'desktop overlay exists');
  const overlay = overlays.find(window => window.url().includes('primary=true'));
  await overlay.waitForSelector('.desktop-pet');
  assert.equal(await overlay.locator('.desktop-pet').count(), 7);
  const pet = overlay.locator('.pet-body').first(); const bounds = await pet.boundingBox();
  await overlay.mouse.move(bounds.x + 50, bounds.y + 70);
  await overlay.mouse.down(); await overlay.mouse.move(bounds.x - 35, bounds.y + 35, { steps: 12 }); await overlay.mouse.up();
  await untilState(overlay, s => !!s.pets.xia);
  await overlay.screenshot({ path: 'test-results/garden-pets.png', omitBackground: true });
  const native = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => ({ visible: w.isVisible(), bounds: w.getBounds(), background: w.getBackgroundColor(), title: w.getTitle() })));
  fs.writeFileSync('test-results/native-windows.json', JSON.stringify(native, null, 2));
  assert.deepEqual(failures, []);
  console.log('PASS: real Electron windows, group chat, targeted reply, praise, timer, DND, memory, encrypted key, pet drag and screenshots.');
} finally { await app.close(); }
// A second process proves SQLite state survives app shutdown.
const restarted = await electron.launch({ args: [root], env, timeout: 30000 });
try {
  await restarted.firstWindow();
  let page; for (let attempt = 0; attempt < 100 && !page; attempt++) { page = restarted.windows().find(w => w.url().includes('view=chat')); if (!page) await new Promise(resolve => setTimeout(resolve, 100)); }
  assert.ok(page); await page.waitForSelector('.app-shell');
  const state = await page.evaluate(() => window.garden.getState());
  assert.equal(state.room.furniture.length,7);assert.ok(state.privateMessages.xia.some(m=>m.text==='私聊冒烟测试'));
  assert.equal(state.memories[0].text, '测试：喜欢安静的雨天'); assert.equal(state.settings.dnd, true); assert.ok(state.pets.xia); assert.equal(state.skins.xia, 'animated');
  console.log('PASS: SQLite restore after restart.');
} finally { await restarted.close(); }
