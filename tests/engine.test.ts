import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, chooseSpeakers, restoreState, ids } from '../src/shared/director.ts';
import { GardenEngine } from '../electron/engine.ts';
import { sseData, requestText } from '../electron/provider.ts';

test('mentions choose a single identity and muted members never respond', () => {
  const state = initialState();
  assert.deepEqual(chooseSpeakers(state, '@Claude 你好'), ['rin']);
  state.muted = ['rin']; assert.deepEqual(chooseSpeakers(state, '@Claude 你好'), []);
  assert.equal(chooseSpeakers(state, '大家好').includes('rin'), false);
  state.muted = [...ids]; assert.deepEqual(chooseSpeakers(state, '你好'), []);
});
test('stopping a turn prevents delayed replies from being committed', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 30);
  const before = engine.state.messages.length;
  const sending = engine.dispatch({ type: 'send', text: '你好' });
  await engine.dispatch({ type: 'stop' }); await sending;
  assert.equal(engine.state.messages.length, before + 1);
  assert.equal(engine.state.busy, false);
});
test('a new turn invalidates the previous turn without cancelling the new one', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 15);
  const initialLength = engine.state.messages.length;
  const first = engine.dispatch({ type: 'send', text: '@DeepSeek 你好', target: 'xia' });
  const second = engine.dispatch({ type: 'send', text: '@Claude 你好', target: 'rin' });
  await Promise.all([first, second]);
  const replies = engine.state.messages.slice(initialLength).filter(m => m.speaker !== 'user' && m.speaker !== 'system');
  assert.deepEqual(replies.map(m => m.speaker), ['rin']);
  assert.equal(engine.state.busy, false);
});
test('focus creates once, finishes once, and DND suppresses proactive character messages', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'focus', minutes: 1 });
  const id = engine.state.focus!.id;
  await engine.dispatch({ type: 'focus', minutes: 2 }); assert.equal(engine.state.focus!.id, id);
  await engine.dispatch({ type: 'settings', patch: { dnd: true } });
  const count = engine.state.messages.length;
  engine.tick(Date.now() + 120_000); engine.tick(Date.now() + 121_000);
  assert.equal(engine.state.focus, null); assert.equal(engine.state.messages.length, count + 1);
  assert.equal(engine.state.messages.at(-1)!.speaker, 'system');
});
test('cancelled focus cannot later produce a completion event', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({ type: 'focus', minutes: 1 }); await engine.dispatch({ type: 'cancel-focus' });
  await engine.dispatch({ type: 'settings', patch: { autonomous: false } });
  const count = engine.state.messages.length; engine.tick(Date.now() + 120_000);
  assert.equal(engine.state.messages.length, count);
});
test('DND and a shared cooldown bound autonomous messages', async () => {
  const engine = new GardenEngine(initialState(), () => {}, undefined, 0);
  await engine.dispatch({type:'room-settings',patch:{autonomous:false}});
  await engine.dispatch({ type: 'settings', patch: { dnd: true } });
  const count = engine.state.messages.length; engine.tick(Date.now() + 700_000);
  assert.equal(engine.state.messages.length, count);
  await engine.dispatch({ type: 'settings', patch: { dnd: false } });
  const future = Date.now() + 800_000; engine.tick(future); engine.tick(future + 1000);
  assert.equal(engine.state.messages.length, count + 1);
});
test('memory is explicitly saved, deduplicated and removable', async () => {
  const engine = new GardenEngine();
  await engine.dispatch({ type: 'remember', text: '我喜欢雨天' }); await engine.dispatch({ type: 'remember', text: '我喜欢雨天' });
  assert.equal(engine.state.memories.length, 1);
  await engine.dispatch({ type: 'forget', id: engine.state.memories[0].id }); assert.equal(engine.state.memories.length, 0);
});
test('restoring resets transient state but retains a due focus task for settlement', () => {
  const saved = initialState(); saved.busy = true; saved.mood.xia = 'talk'; saved.focus = { id: 'test', minutes: 25, endAt: 1, owner: 'rin' };
  const state = restoreState(saved); assert.equal(state.busy, false); assert.equal(state.mood.xia, 'idle'); assert.equal(state.focus!.endAt, 1);
  assert.equal(restoreState({ version: 1, settings: { dnd: 'true', intimacy: 999 } }).settings.dnd, false);
});
test('SSE decoding handles UTF-8 split across chunks and CRLF boundaries', async () => {
  const bytes = new TextEncoder().encode('data: {"text":"你好"}\r\n\r\ndata: [DONE]\n\n');
  const stream = new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3)); controller.close(); } });
  const events = []; for await (const data of sseData(stream)) events.push(data);
  assert.deepEqual(events, ['{"text":"你好"}', '[DONE]']);
});
test('adapter extracts spoken content and excludes reasoning fields', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('data: {"choices":[{"delta":{"reasoning_content":"private","content":"你好"}}]}\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  try { assert.equal(await requestText('deepseek', 'test-model', 'fake-test-key', 'system', [{ role: 'user', content: 'hi' }], new AbortController().signal, () => {}), '你好'); }
  finally { globalThis.fetch = original; }
});
test('Claude stream extracts text deltas', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"你好"}}\n\n');
  try { assert.equal(await requestText('claude', 'test', 'fake', 'system', [{ role: 'user', content: 'hi' }], new AbortController().signal, () => {}), '你好'); }
  finally { globalThis.fetch = original; }
});
