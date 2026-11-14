import {_electron as electron} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Frame stills for artistic review of the 13 new Claude pack clips (not runtime routing).
const clips = [
  'rivalrySoft', 'reassure', 'gptJoke', 'thinking', 'success', 'hesitate', 'goodnight',
  'fishShy', 'walk', 'walkOpposite', 'recoverStep', 'turnToLeft', 'turnToRight',
];
const out = path.resolve('test-results/claude-frame-review');
fs.mkdirSync(out, {recursive: true});
const env = {...process.env, GARDEN_TEST_DATA: path.join(out, `profile-${Date.now()}`)};
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({args: [process.cwd()], env});
const report = {scope: 'still frames for identity/book-arm/feet/bars; not artistic final stamp', clips: []};
try {
  await app.firstWindow();
  let main;
  for (let i = 0; i < 100 && !main; i++) {
    main = app.windows().find(p => p.url().includes('view=chat'));
    if (!main) await new Promise(r => setTimeout(r, 100));
  }
  await main.evaluate(async () => {
    await window.garden.dispatch({type: 'settings', patch: {autonomous: false, mode: 'demo'}});
    await window.garden.dispatch({type: 'room-settings', patch: {autonomous: false, wandering: false}});
  });
  const selector = '.room-character[data-character=rin] .claude-video-sprite';
  for (const id of clips) {
    await main.evaluate(clipId => window.garden.dispatch({type: 'play-clip', id: 'rin', clipId}), id);
    await main.waitForFunction(({selector, id}) => {
      const e = document.querySelector(selector);
      const v = e?.querySelector('video');
      return e?.dataset.clip === id && v?.readyState >= 2 && !v.paused;
    }, {selector, id}, {timeout: 25000});
    const frames = [];
    for (const t of [0.4, 2.5, 4.6]) {
      await main.locator(`${selector} video`).evaluate((v, seek) => {
        v.pause();
        v.currentTime = Math.min(seek, Math.max(0, v.duration - 0.05));
      }, t);
      await main.waitForTimeout(150);
      const file = path.join(out, `${id}-t${String(t).replace('.', 'p')}.png`);
      await main.locator(selector).screenshot({path: file});
      frames.push({t, file: path.basename(file)});
    }
    report.clips.push({id, frames});
    console.log('captured', id);
  }
  fs.writeFileSync(path.join(out, 'frames.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await app.close();
}
