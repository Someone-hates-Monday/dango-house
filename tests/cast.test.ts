import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState, restoreState, chooseSpeakers } from '../src/shared/director.ts';
import {
  CORE_CAST,
  inferCastPreset,
  isImpersonating,
  migratePresentIds,
  presentCast,
  presentForPreset,
  preferredProvider,
  speakingCast,
} from '../src/shared/cast.ts';
import { rivalryEscalationCast } from '../src/shared/favor.ts';
import { characters } from '../src/shared/characters.ts';

const allIds = characters.map(c => c.id);

test('house brain preferred provider falls back and honors override', () => {
  const state = initialState();
  state.settings.provider = 'glm';
  assert.equal(preferredProvider(state, 'rin'), 'glm');
  assert.equal(isImpersonating('rin', 'glm'), true);
  state.characterProviders = { rin: 'claude' };
  assert.equal(preferredProvider(state, 'rin'), 'claude');
  assert.equal(isImpersonating('rin', 'claude'), false);
});

test('cast presets write presentIds, not mute-as-absence', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-preset', preset: 'core' });
  assert.equal(engine.state.settings.castPreset, 'core');
  assert.deepEqual([...engine.state.presentIds].sort(), [...CORE_CAST].sort());
  assert.equal(engine.state.muted.length, 0);
  for (const id of CORE_CAST) assert.ok(presentCast(engine.state).includes(id));
  assert.equal(presentCast(engine.state).length, 3);
  const speakers = chooseSpeakers(engine.state, 'hello');
  assert.ok(speakers.every(id => CORE_CAST.includes(id)));
});

test('mute only quiets a present resident; preset stays present-based', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-preset', preset: 'all' });
  await engine.dispatch({ type: 'mute', id: 'grok' });
  assert.equal(engine.state.settings.castPreset, 'all');
  assert.ok(engine.state.presentIds.includes('grok'));
  assert.ok(engine.state.muted.includes('grok'));
  assert.equal(speakingCast(engine.state).includes('grok'), false);
  assert.equal(presentCast(engine.state).includes('grok'), true);
});

test('cast-present removes someone from stage without muting others', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-present', id: 'grok', present: false });
  assert.equal(engine.state.settings.castPreset, 'custom');
  assert.equal(presentCast(engine.state).includes('grok'), false);
  assert.equal(engine.state.muted.includes('grok'), false);
  assert.equal(presentCast(engine.state).length, 6);
});

test('migration: old core muted-as-cast becomes three present', () => {
  const migrated = migratePresentIds({
    castPreset: 'core',
    muted: presentForPreset('all').filter(id => !CORE_CAST.includes(id)),
  });
  assert.deepEqual([...migrated.presentIds].sort(), [...CORE_CAST].sort());
  assert.equal(migrated.muted.length, 0);
  assert.equal(migrated.castPreset, 'core');
});

test('migration: old all/custom keeps quiet flags and everyone present', () => {
  const migrated = migratePresentIds({
    castPreset: 'custom',
    muted: ['grok', 'kimi'],
  });
  assert.equal(migrated.presentIds.length, 7);
  assert.deepEqual([...migrated.muted].sort(), ['grok', 'kimi']);
});

test('restoreState applies present migration and keeps overrides', () => {
  const raw = {
    version: 1 as const,
    settings: { castPreset: 'core' as const },
    muted: allIds.filter(id => !CORE_CAST.includes(id)),
    characterProviders: { shiori: 'openai' },
  };
  const restored = restoreState(raw);
  assert.deepEqual([...restored.presentIds].sort(), [...CORE_CAST].sort());
  assert.equal(restored.characterProviders.shiori, 'openai');
  assert.equal(restored.settings.castPreset, 'core');
});

test('a two-person speaking cast schedules each rival only once', () => {
  const state = initialState();
  state.presentIds = ['xia', 'rin'];
  state.muted = [];
  assert.deepEqual(rivalryEscalationCast(state, 'xia'), ['rin']);
});

test('changing cast cancels pending scenes instead of leaving orphan dialogue', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'yuri-scene', id: 'kimi-rin-bookmark' });
  await engine.dispatch({ type: 'cast-preset', preset: 'core' });
  const count = engine.state.messages.length;
  engine.tick(Date.now() + 15_000);
  assert.equal(engine.state.messages.length, count);
});

test('an absent partner prevents a partial pair scene from playing', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-present', id: 'xia', present: false });
  const count = engine.state.messages.length;
  await engine.dispatch({ type: 'yuri-scene', id: 'rin-xia-seat' });
  engine.tick(Date.now() + 15_000);
  assert.equal(engine.state.messages.length, count);
});

test('quiet present partner also blocks pair scene', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'mute', id: 'xia' });
  const count = engine.state.messages.length;
  await engine.dispatch({ type: 'yuri-scene', id: 'rin-xia-seat' });
  engine.tick(Date.now() + 15_000);
  assert.equal(engine.state.messages.length, count);
});

test('empty present cast yields no speakers and no API cast', () => {
  const state = initialState();
  state.presentIds = [];
  state.muted = [];
  assert.deepEqual(chooseSpeakers(state, 'hello'), []);
  assert.equal(inferCastPreset([]), 'custom');
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
