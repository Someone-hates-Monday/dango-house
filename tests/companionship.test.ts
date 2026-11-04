import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState, restoreState } from '../src/shared/director.ts';
import { bondTier, BOND_INTIMATE } from '../src/shared/bonds.ts';
import { yuriScenesForBond } from '../src/shared/social-yuri.ts';
import { relationshipKey } from '../src/shared/social.ts';

test('favor streak escalates rivalry every three praises', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'praise', id: 'xia' });
  assert.equal(engine.state.favor.focusId, 'xia');
  assert.equal(engine.state.favor.streak, 1);
  await engine.dispatch({ type: 'praise', id: 'xia' });
  await engine.dispatch({ type: 'praise', id: 'xia' });
  assert.equal(engine.state.favor.streak, 3);
  const notice = engine.state.messages.filter(m => m.kind === 'notice').at(-1);
  assert.match(notice?.text ?? '', /3|连续|streak|連続/i);
});

test('pairTone restores and unlocks intimate yuri scenes by bond', () => {
  const saved = initialState();
  saved.settings.pairTone = 'vivid';
  saved.bonds[relationshipKey('gemini', 'glm')] = BOND_INTIMATE;
  const restored = restoreState(saved);
  assert.equal(restored.settings.pairTone, 'vivid');
  assert.equal(bondTier(restored.bonds[relationshipKey('gemini', 'glm')]), 'intimate');
  const pool = yuriScenesForBond(restored.bonds, []);
  assert.ok(pool.some(s => s.id === 'gemini-glm-hug'));
});

test('yuri-scene dispatch queues pair steps', async () => {
  const state = initialState();
  state.bonds[relationshipKey('rin', 'xia')] = 70;
  state.bonds[relationshipKey('xia', 'rin')] = 70;
  const engine = new GardenEngine(state, () => {}, undefined, 0);
  await engine.dispatch({ type: 'yuri-scene', id: 'rin-xia-seat' });
  engine.tick(Date.now() + 20_000);
  assert.ok(engine.state.messages.some(m => m.speaker === 'rin' || m.speaker === 'xia'));
});
