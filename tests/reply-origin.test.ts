import test from 'node:test';
import assert from 'node:assert/strict';
import { GardenEngine } from '../electron/engine.ts';
import { initialState } from '../src/shared/director.ts';
import { shouldAttemptStoryLlm, storyLlmPrompt } from '../src/shared/story-llm.ts';
import { planSeatShare } from '../src/shared/companion-stories.ts';

test('demo replies mark origin as local script', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'settings', patch: { mode: 'demo' } });
  await engine.dispatch({ type: 'send', text: '@Claude 你好', target: 'rin' });
  const reply = engine.state.messages.filter(m => m.speaker === 'rin').at(-1);
  assert.ok(reply);
  assert.equal(reply!.origin?.backend, 'local');
});

test('model generate result stamps actual provider on the message', async () => {
  const engine = new GardenEngine(
    initialState(),
    () => {},
    async () => ({ text: '我在。', provider: 'glm', model: 'test-model' }),
    0,
  );
  await engine.dispatch({ type: 'settings', patch: { mode: 'api', model: 'test-model', provider: 'glm' } });
  await engine.dispatch({ type: 'send', text: '@Claude 你好', target: 'rin' });
  const reply = engine.state.messages.filter(m => m.speaker === 'rin').at(-1);
  assert.equal(reply?.origin?.backend, 'model');
  assert.equal(reply?.origin?.provider, 'glm');
  assert.equal(reply?.origin?.model, 'test-model');
});

test('story LLM helper stays opt-in and never claims offline enrichment', () => {
  const state = initialState();
  assert.equal(shouldAttemptStoryLlm(state), false);
  state.settings.mode = 'api';
  state.settings.model = 'x';
  assert.equal(shouldAttemptStoryLlm(state), true);
  const plan = planSeatShare(state, Date.now());
  assert.ok(plan);
  assert.match(storyLlmPrompt(plan!), /seat-share/);
});
