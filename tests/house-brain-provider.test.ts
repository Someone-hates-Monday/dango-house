import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReply } from '../electron/provider.ts';
import { initialState } from '../src/shared/director.ts';

test('one house backend uses distinct resident personas and an honest identity prompt', async () => {
  const state = initialState();
  state.settings.provider = 'glm';
  state.connections.glm = { model: 'fixture', endpoint: 'http://127.0.0.1:39999/v1', tools: false };
  const captured: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    captured.push(JSON.parse(String(init?.body)));
    return new Response('data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: [DONE]\n\n', { status: 200 });
  };
  try {
    for (const id of ['rin', 'xia'] as const) {
      await generateReply(state, id, '你好', async provider => { assert.equal(provider, 'glm'); return 'fixture-key'; }, new AbortController().signal, () => {});
    }
    assert.equal(captured.length, 2);
    assert.notEqual(captured[0].messages[0].content, captured[1].messages[0].content);
    assert.match(captured[0].messages[0].content, /后端实际是.*GLM/);
    assert.match(captured[0].messages[0].content, /不要声称.*官方/);
    assert.equal(captured[0].model, 'fixture');
  } finally { globalThis.fetch = originalFetch; }
});

test('a missing override key falls back to the house model and reports the used backend', async () => {
  const state = initialState();
  state.settings.provider = 'glm';
  state.characterProviders.rin = 'claude';
  state.connections.glm = { model: 'house-fixture', endpoint: 'http://127.0.0.1:39999/v1', tools: false };
  let body: any;
  const fallback: string[][] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return new Response('data: {"choices":[{"delta":{"content":"我在这里"}}]}\n\ndata: [DONE]\n\n');
  };
  try {
    await generateReply(state, 'rin', '你好', async provider => provider === 'glm' ? 'fixture-key' : '', new AbortController().signal, () => {}, undefined, (wanted, used) => fallback.push([wanted, used]));
    assert.deepEqual(fallback, [['claude', 'glm']]);
    assert.equal(body.model, 'house-fixture');
    assert.match(body.messages[0].content, /后端实际是.*GLM/);
  } finally { globalThis.fetch = originalFetch; }
});
