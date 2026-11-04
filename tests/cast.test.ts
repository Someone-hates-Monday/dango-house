import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState, restoreState } from '../src/shared/director.ts';
import {
  CORE_CAST,
  inferCastPreset,
  isImpersonating,
  mutedForPreset,
  preferredProvider,
} from '../src/shared/cast.ts';
import { chooseSpeakers } from '../src/shared/director.ts';
import { rivalryEscalationCast } from '../src/shared/favor.ts';

test('house brain preferred provider falls back and honors override', () => {
  const state = initialState();
  state.settings.provider = 'glm';
  assert.equal(preferredProvider(state, 'rin'), 'glm');
  assert.equal(isImpersonating('rin', 'glm'), true);
  state.characterProviders = { rin: 'claude' };
  assert.equal(preferredProvider(state, 'rin'), 'claude');
  assert.equal(isImpersonating('rin', 'claude'), false);
});

test('cast presets mute everyone except core three', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-preset', preset: 'core' });
  assert.equal(engine.state.settings.castPreset, 'core');
  assert.deepEqual(
    [...engine.state.muted].sort(),
    [...mutedForPreset('core')].sort(),
  );
  for (const id of CORE_CAST) assert.equal(engine.state.muted.includes(id), false);
  const speakers = chooseSpeakers(engine.state, 'hello');
  assert.ok(speakers.every(id => CORE_CAST.includes(id)));
});

test('manual mute flips preset to custom; restore keeps overrides', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-preset', preset: 'all' });
  await engine.dispatch({ type: 'mute', id: 'grok' });
  assert.equal(engine.state.settings.castPreset, 'custom');
  assert.equal(inferCastPreset(engine.state.muted), 'custom');

  engine.state.characterProviders = { shiori: 'openai' };
  const restored = restoreState(engine.state);
  assert.equal(restored.characterProviders.shiori, 'openai');
  assert.equal(restored.settings.castPreset, 'custom');
});

test('a two-person cast schedules each rival only once', () => {
  const state = initialState();
  state.muted = ['shiori', 'gemini', 'glm', 'kimi', 'grok'];
  assert.deepEqual(rivalryEscalationCast(state, 'xia'), ['rin']);
});

test('changing cast cancels pending scenes instead of leaving orphan dialogue', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'yuri-scene', id: 'kimi-rin-bookmark' });
  await engine.dispatch({ type: 'cast-preset', preset: 'core' });
  const count = engine.state.messages.length;
  engine.tick(Date.now() + 15_000);
  assert.equal(engine.state.messages.length, count);
  assert.ok(Object.values(engine.state.bodies).every(body => body.pose === 'idle'));
});

test('a muted partner prevents a partial pair scene from playing', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'mute', id: 'xia' });
  const count = engine.state.messages.length;
  await engine.dispatch({ type: 'yuri-scene', id: 'rin-xia-seat' });
  engine.tick(Date.now() + 15_000);
  assert.equal(engine.state.messages.length, count);
});

test('global autonomy off suppresses idle scene scheduling as well as greetings', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'settings', patch: { autonomous: false } });
  const count = engine.state.messages.length;
  engine.tick(Date.now() + 200_000);
  engine.tick(Date.now() + 220_000);
  assert.equal(engine.state.messages.length, count);
  assert.equal(engine.state.room.log.length, 0);
});
