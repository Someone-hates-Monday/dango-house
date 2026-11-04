import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Real renderer/state checks with no personal profile, keys or network model calls.
const out = path.resolve('test-results/companion-experience');
fs.mkdirSync(out, { recursive: true });
const env = { ...process.env, GARDEN_TEST_DATA: path.join(out, `profile-${Date.now()}`) };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ args: [process.cwd()], env });
const report = { checks: [], limitations: [], errors: [] };
try {
  await app.firstWindow();
  let main, overlay;
  for (let i = 0; i < 100 && (!main || !overlay); i++) {
    main = app.windows().find(p => p.url().includes('view=chat'));
    overlay = app.windows().find(p => p.url().includes('view=pets') && p.url().includes('primary=true'));
    if (!main || !overlay) await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(main && overlay);
  main.on('pageerror', error => report.errors.push(error.message));
  overlay.on('pageerror', error => report.errors.push(error.message));
  await main.waitForSelector('.room-character');
  const dispatch = action => main.evaluate(action => window.garden.dispatch(action), action);
  const state = () => main.evaluate(() => window.garden.getState());
  await dispatch({ type: 'settings', patch: { autonomous: false, mode: 'demo', provider: 'glm' } });
  await dispatch({ type: 'room-settings', patch: { autonomous: false, wandering: false } });
  await dispatch({ type: 'presentation', patch: { desktopMode: 'dock' } });
  await main.getByRole('button', { name: '连接与偏好', exact: true }).click();
  await main.getByRole('button', { name: '核心三人', exact: true }).click();
  assert.deepEqual((await state()).muted.sort(), ['gemini', 'glm', 'grok', 'kimi']);
  await overlay.locator('.dock-pet').first().waitFor();
  assert.equal(await overlay.locator('.dock-pet').count(), 7);
  report.limitations.push('core preset limits speakers to three; all seven avatars still render in Dock and room');
  await main.screenshot({ path: path.join(out, 'cast-settings.png'), scale: 'css' });
  await main.getByRole('button', { name: '全员（7）', exact: true }).click();
  assert.equal((await state()).muted.length, 0);
  report.checks.push('real settings UI switches all/core cast presets');
  await dispatch({ type: 'settings', patch: { mode: 'api' } });
  await main.getByRole('button', { name: /公馆群聊/ }).click();
  await dispatch({ type: 'select', id: 'rin' });
  await main.locator('.via-badge').waitFor();
  assert.match(await main.locator('.via-badge').innerText(), /GLM/);
  report.checks.push('Claude persona honestly displays preferred GLM backend');
  await dispatch({ type: 'settings', patch: { mode: 'demo' } });
  await dispatch({ type: 'cast-preset', preset: 'core' });
  await dispatch({ type: 'pat', id: 'xia' });
  await dispatch({ type: 'pat', id: 'xia' });
  await dispatch({ type: 'pat', id: 'xia' });
  await main.waitForFunction(async () => {
    const s = await window.garden.getState();
    return s.messages.some(m => m.speaker === 'rin' && /并肩|位置|偏爱/.test(m.text)) && s.bodies.rin.bubble;
  });
  await main.getByRole('button', { name: /互动小屋/ }).click();
  await main.locator('.room-character[data-character=rin] .room-speech').waitFor();
  await overlay.locator('.dock-pet[data-character=rin] .pet-bubble').waitFor();
  await main.screenshot({ path: path.join(out, 'rivalry-room.png'), scale: 'css' });
  await overlay.screenshot({ path: path.join(out, 'rivalry-dock.png'), omitBackground: true, scale: 'css' });
  report.checks.push('three pats produce real rival speech and avatar bubbles in room and Dock');
  const playPair = async tone => {
    await dispatch({ type: 'settings', patch: { pairTone: tone } });
    await main.locator('#yuri-scene').selectOption('rin-xia-seat');
    await main.locator('#yuri-scene').locator('..').getByRole('button').click();
    await main.waitForFunction(async () => {
      const s = await window.garden.getState(); return s.bodies.rin.bubble.length > 0;
    });
    return (await state()).bodies.rin.bubble;
  };
  const soft = await playPair('soft');
  const vivid = await playPair('vivid');
  assert.notEqual(soft, vivid);
  await main.screenshot({ path: path.join(out, 'pair-scene.png'), scale: 'css' });
  report.checks.push('unlocked pair scene runs through UI and soft/vivid have different dialogue');
  await dispatch({ type: 'mute', id: 'xia' });
  const before = (await state()).messages.length;
  await main.waitForTimeout(4800);
  assert.equal((await state()).messages.length, before);
  report.checks.push('cast change cancels queued pair dialogue');
  await dispatch({ type: 'settings', patch: { dnd: true } });
  assert.ok(Object.values((await state()).bodies).every(body => body.pose === 'idle'));
  report.checks.push('DND clears ongoing reactions');
  assert.deepEqual(report.errors, []);
  report.success = true;
} catch (error) {
  report.success = false; report.failure = error.message; process.exitCode = 1; console.error(error);
} finally {
  await app.close();
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
