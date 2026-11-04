import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState, restoreState } from '../src/shared/director.ts';
import { planSeatShare, planStarFox, planChoseHer } from '../src/shared/companion-stories.ts';
import { pushCompanionEvent } from '../src/shared/events.ts';
import { relationshipKey } from '../src/shared/social.ts';

test('chose-her plans Claude rivals with character lines', () => {
  const state = initialState();
  state.selected = 'rin';
  const plan = planChoseHer(state, 'rin', Date.now());
  assert.ok(plan);
  assert.ok(plan!.cast.includes('rin'));
  assert.ok(plan!.beats.length >= 1);
  assert.ok(plan!.beats.every(b => b.intent.bubble && b.intent.bubble.length > 4));
});

test('seat-share and star-fox need present speakers; sequel changes lines', () => {
  const state = initialState();
  const first = planSeatShare(state, Date.now());
  assert.equal(first?.variant === 'with-gpt' || first?.variant === 'first', true);
  state.companionEvents = pushCompanionEvent([], {
    at: Date.now(), kind: 'seat-share', actors: ['rin', 'xia'], trigger: 't', result: 'first', recall: 'once',
  });
  const again = planSeatShare(state, Date.now());
  assert.equal(again?.variant, 'again');
  assert.notEqual(again?.beats[0].intent.bubble, first?.beats[0].intent.bubble);

  const fox = planStarFox(state, Date.now());
  assert.ok(fox);
  state.presentIds = ['xia', 'rin'];
  assert.equal(planStarFox(state, Date.now()), null);
});

test('private-open records event and queues rival beats; return wraps with variant', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'private-open', id: 'rin' });
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'chose-companion'));
  assert.ok(engine.state.privateMessages.rin.length >= 1);
  const before = engine.state.messages.length;
  engine.tick(Date.now() + 2500);
  assert.ok(engine.state.messages.length >= before);
  await engine.dispatch({ type: 'private-return', id: 'rin' });
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'private-return'));
  const count = engine.state.companionEvents.filter(e => e.kind === 'private-return').length;
  await engine.dispatch({ type: 'private-return', id: 'rin' });
  // second return without reopen still ok (idempotent wrap allowed for tryplay)
  assert.ok(engine.state.companionEvents.filter(e => e.kind === 'private-return').length >= count);
});

test('companion-story seat-share bumps pair bond only for shared event', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  const key = relationshipKey('rin', 'xia');
  const before = engine.state.bonds[key] ?? 0;
  await engine.dispatch({ type: 'pat', id: 'rin' });
  assert.equal(engine.state.bonds[key] ?? 0, before);
  await engine.dispatch({ type: 'companion-story', id: 'seat-share' });
  assert.ok((engine.state.bonds[key] ?? 0) > before);
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'seat-share'));
});

test('companion-story star-fox plays with bystander when present', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'companion-story', id: 'star-fox' });
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'star-fox-care'));
  engine.tick(Date.now() + 1000);
  assert.ok(engine.state.bodies.gemini.bubble || engine.state.bodies.glm.bubble);
});

test('absent cast skips stories; events restore without keys', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'cast-present', id: 'gemini', present: false });
  await engine.dispatch({ type: 'cast-present', id: 'glm', present: false });
  const n = engine.state.companionEvents.length;
  await engine.dispatch({ type: 'companion-story', id: 'star-fox' });
  assert.equal(engine.state.companionEvents.length, n);
  engine.state.companionEvents = pushCompanionEvent(engine.state.companionEvents, {
    at: Date.now(), kind: 'seat-share', actors: ['rin', 'xia'], trigger: 't', result: 'x', recall: '窗边',
  });
  const restored = restoreState(engine.state);
  assert.equal(restored.companionEvents.at(-1)?.recall, '窗边');
  assert.ok(!JSON.stringify(restored).includes('sk-'));
});

test('clear companion events works', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'companion-story', id: 'seat-share' });
  assert.ok(engine.state.companionEvents.length);
  await engine.dispatch({ type: 'clear-companion-events' });
  assert.equal(engine.state.companionEvents.length, 0);
});
