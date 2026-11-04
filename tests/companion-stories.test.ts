import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState, restoreState } from '../src/shared/director.ts';
import { planSeatShare, planStarFox, planChoseHer, privateReturnLine } from '../src/shared/companion-stories.ts';
import { pushCompanionEvent } from '../src/shared/events.ts';
import { relationshipKey } from '../src/shared/social.ts';
/** Advance through beats and owned action tails until the job can commit. */
function settleStory(engine: GardenEngine, from = Date.now(), lastOffset = 12_000) {
  const end = from + lastOffset + 20_000;
  for (let t = from; t <= end; t += 500) engine.tick(t);
}

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

test('privateReturnLine uses prior private-return for revisit, not chose-companion', () => {
  const first = privateReturnLine('rin', ['xia'], [], 'warm');
  assert.ok(!/又回来|第二次|又溜回来/.test(first));
  const revisit = privateReturnLine('rin', ['xia'], [{
    id: 'e1', at: Date.now() - 1000, kind: 'private-return', actors: ['rin'], trigger: 't', result: 'wrap', recall: 'x',
  }], 'warm');
  assert.ok(/又回来|第二次|又溜回来/.test(revisit));
});

test('private-open queues chose-her; reward commits after settle; return is visit-idempotent', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  const now = Date.now();
  await engine.dispatch({ type: 'private-open', id: 'rin' });
  assert.equal(engine.state.companionEvents.some(e => e.kind === 'chose-companion'), false, 'must not commit on open alone');
  settleStory(engine, now, 8_000);
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'chose-companion'));
  assert.ok(engine.state.privateMessages.rin.length >= 1);
  await engine.dispatch({ type: 'private-return', id: 'rin' });
  assert.equal(engine.state.companionEvents.filter(e => e.kind === 'private-return').length, 1);
  await engine.dispatch({ type: 'private-return', id: 'rin' });
  assert.equal(engine.state.companionEvents.filter(e => e.kind === 'private-return').length, 1, 'duplicate return must not re-book');
});

test('companion-story seat-share commits bond+event only after settle; cancel keeps both clean', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  const key = relationshipKey('rin', 'xia');
  const before = engine.state.bonds[key] ?? 0;
  await engine.dispatch({ type: 'pat', id: 'rin' });
  assert.equal(engine.state.bonds[key] ?? 0, before);
  const t0 = Date.now();
  await engine.dispatch({ type: 'companion-story', id: 'seat-share' });
  assert.equal(engine.state.companionEvents.some(e => e.kind === 'seat-share'), false, 'queued ≠ completed');
  assert.equal(engine.state.bonds[key] ?? 0, before);
  settleStory(engine, t0, 10_000);
  assert.ok((engine.state.bonds[key] ?? 0) > before);
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'seat-share'));

  const e2 = new GardenEngine(initialState(), () => {}, undefined, 0);
  const bonds = { ...e2.state.bonds };
  await e2.dispatch({ type: 'companion-story', id: 'seat-share' });
  await e2.dispatch({ type: 'stop' });
  assert.deepEqual(e2.state.bonds, bonds);
  assert.equal(e2.state.companionEvents.some(e => e.kind === 'seat-share'), false);
});

test('companion-story star-fox plays with bystander when present', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  const t0 = Date.now();
  await engine.dispatch({ type: 'companion-story', id: 'star-fox' });
  engine.tick(t0 + 1000);
  assert.ok(engine.state.bodies.gemini.bubble || engine.state.bodies.glm.bubble);
  settleStory(engine, t0, 10_000);
  assert.ok(engine.state.companionEvents.some(e => e.kind === 'star-fox-care'));
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

test('clear companion events works after real completion', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  const t0 = Date.now();
  await engine.dispatch({ type: 'companion-story', id: 'seat-share' });
  settleStory(engine, t0, 10_000);
  assert.ok(engine.state.companionEvents.length);
  await engine.dispatch({ type: 'clear-companion-events' });
  assert.equal(engine.state.companionEvents.length, 0);
});
