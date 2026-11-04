// Supplemental review contracts. No network, personal profile or API credentials.
// Run: node --import tsx scripts/review-companion-repair.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { GardenEngine } from '../electron/engine.ts';
import { initialState } from '../src/shared/director.ts';

const report = { reviewedHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), checks: [] };
const originalNow = Date.now;
let now = 1_900_000_000_000;
Date.now = () => now;
const engine = () => {
  const s = initialState();
  s.settings.autonomous = false;
  s.room.autonomous = false;
  return new GardenEngine(s, () => {}, undefined, 0);
};
async function check(name, run) {
  now = 1_900_000_000_000;
  try { await run(); report.checks.push({ name, pass: true }); }
  catch (error) { report.checks.push({ name, pass: false, error: error.message }); }
}
try {
  await check('no story reward while final dispatched action is still active', async () => {
    const e = engine();
    await e.dispatch({ type: 'companion-story', id: 'seat-share' });
    const start = now;
    for (const offset of [3200, 6400, 9000, 13500]) { now = start + offset; e.tick(now); }
    assert.ok(e.state.bodies.shiori.until > now, 'fixture must still have an active final action');
    assert.equal(e.state.companionEvents.some(x => x.kind === 'seat-share'), false,
      `completed with ${e.state.bodies.shiori.until - now}ms remaining on final action`);
  });
  await check('rejected reaction cannot immediately overwrite a user scene actor', async () => {
    const e = engine();
    await e.dispatch({ type: 'companion-story', id: 'seat-share' });
    const bubble = e.state.bodies.rin.bubble;
    const logCount = e.state.room.log.length;
    await e.dispatch({ type: 'companion-visit', id: 'rin', target: 'kimi' });
    assert.equal(e.state.bodies.rin.bubble, bubble, 'reaction performed before its queue admission');
    assert.equal(e.state.room.log.length, logCount, 'rejected reaction still dispatched an action');
  });
  await check('removing a private visitor cancels return settlement', async () => {
    const e = engine();
    await e.dispatch({ type: 'private-open', id: 'rin' });
    await e.dispatch({ type: 'cast-present', id: 'rin', present: false });
    await e.dispatch({ type: 'private-return', id: 'rin' });
    assert.equal(e.state.companionEvents.some(x => x.kind === 'private-return'), false,
      'absent character produced a successful private-return memory');
  });
} finally { Date.now = originalNow; }
fs.mkdirSync('test-results/cursor-re-review', { recursive: true });
fs.writeFileSync('test-results/cursor-re-review/contracts.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.checks.some(x => !x.pass)) process.exitCode = 1;
