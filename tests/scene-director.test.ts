import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneDirector, DEFAULT_SETTLE_MS } from '../src/shared/scene-director.ts';

test('user priority blocks reaction overwrite; settle then tryCommit once', () => {
  const d = new SceneDirector(0, 100);
  const now = 1_000;
  const user = d.schedule({
    id: 'u1', cast: ['rin', 'xia'], source: 'seat-share', priority: 'user',
    steps: [{ at: now, actor: 'rin', intent: { action: 'wave' } }, { at: now + 50, actor: 'xia', intent: { action: 'wave' } }],
    reward: { kind: 'seat-share', actors: ['rin', 'xia'], trigger: 't', result: 'x', recall: 'r' },
  }, now);
  assert.equal(user.outcome, 'accepted');
  const reaction = d.schedule({
    id: 'r1', cast: ['xia'], source: 'rivalry', priority: 'reaction',
    steps: [{ at: now + 10, actor: 'xia', intent: { action: 'shy' }, speech: '并肩时间我先预约' }],
  }, now + 5);
  assert.equal(reaction.outcome, 'rejected');

  let { steps, completed } = d.due(now);
  assert.equal(steps.length, 1);
  assert.equal(completed, null);
  ({ steps, completed } = d.due(now + 50));
  assert.equal(steps.length, 1);
  assert.equal(completed, null);
  assert.ok(d.current?.settleUntil === now + 50 + 100);
  ({ steps, completed } = d.due(now + 50 + 100));
  assert.equal(steps.length, 0);
  assert.ok(completed);
  assert.equal(d.tryCommit(completed!), true);
  assert.equal(d.tryCommit(completed!), false);
});

test('clear cancels settle without completion', () => {
  const d = new SceneDirector(0, DEFAULT_SETTLE_MS);
  const now = 0;
  d.schedule({
    id: 'u2', cast: ['rin'], source: 'x', priority: 'user',
    steps: [{ at: 0, actor: 'rin', intent: { action: 'wave' } }],
  }, now);
  d.due(0);
  d.clear();
  const { completed } = d.due(DEFAULT_SETTLE_MS + 10);
  assert.equal(completed, null);
});
