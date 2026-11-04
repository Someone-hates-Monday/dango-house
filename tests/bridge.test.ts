import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initialState } from '../src/shared/director.ts';
import {
  actionFromBridgeTool,
  buildAgentSnapshot,
  bridgeTools,
  cursorMcpConfig,
  codexMcpToml,
} from '../src/shared/bridge.ts';
import { applyBridgePatch, readBridgeFile } from '../electron/bridge/persist.ts';
import { GardenBridgeServer } from '../electron/bridge/http.ts';

test('bridge tools map to safe garden actions', () => {
  assert.equal(actionFromBridgeTool('garden_praise', { id: 'xia' }).type, 'praise');
  assert.equal(actionFromBridgeTool('garden_feed', { id: 'rin', food: 'tea' }).type, 'feed');
  assert.throws(() => actionFromBridgeTool('garden_praise', { id: 'nope' }));
  assert.ok(bridgeTools.some(t => t.name === 'garden_browse_videos'));
});

test('snapshot never includes connection secrets', () => {
  const state = initialState();
  state.connections.glm.endpoint = 'https://secret.example/v1';
  const snap = buildAgentSnapshot(state);
  assert.equal('connections' in snap, false);
  assert.ok(snap.residents.some(r => r.id === 'xia'));
  assert.equal(typeof snap.favor.streak, 'number');
});

test('install snippets point at mcp entry and bridge file', () => {
  const json = cursorMcpConfig('C:/app/bridge-mcp.cjs', 'C:/data/bridge.json');
  assert.equal(json.mcpServers['dango-house'].command, 'node');
  assert.match(codexMcpToml('C:/app/bridge-mcp.cjs', 'C:/data/bridge.json'), /mcp_servers\.dango_house/);
});

test('HTTP bridge serves snapshot with bearer auth', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garden-bridge-'));
  const cfg = applyBridgePatch(dir, { enabled: true, port: 39271 });
  const state = initialState();
  const server = new GardenBridgeServer(
    {
      getState: () => state,
      dispatch: async action => {
        if (action.type === 'praise' && action.id === 'xia') state.favor = { focusId: 'xia', streak: 1 };
      },
    },
    () => readBridgeFile(dir),
  );
  await server.start();
  try {
    const denied = await fetch(`http://127.0.0.1:${cfg.port}/v1/snapshot`);
    assert.equal(denied.status, 401);
    const ok = await fetch(`http://127.0.0.1:${cfg.port}/v1/snapshot`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.ok, true);
    const call = await fetch(`http://127.0.0.1:${cfg.port}/v1/call`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'garden_praise', arguments: { id: 'xia' } }),
    });
    assert.equal(call.status, 200);
    assert.equal(state.favor.focusId, 'xia');
  } finally {
    await server.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
