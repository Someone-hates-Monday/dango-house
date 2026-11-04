import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';

// Install this test-only client outside app dependencies:
// npm install --prefix test-results/mcp-client @modelcontextprotocol/sdk@1.32.2
const sdk = path.resolve('test-results/mcp-client/node_modules/@modelcontextprotocol/sdk/dist/esm');
const { Client } = await import('file:///' + path.join(sdk, 'client/index.js').replaceAll('\\', '/'));
const { StdioClientTransport } = await import('file:///' + path.join(sdk, 'client/stdio.js').replaceAll('\\', '/'));
const out = path.resolve('test-results/agent-bridge');
fs.mkdirSync(out, { recursive: true });
const env = { ...process.env, GARDEN_TEST_DATA: path.join(out, `profile-${Date.now()}`) };
delete env.ELECTRON_RUN_AS_NODE;
const port = await new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const p = server.address().port; server.close(() => resolve(p)); }); });
const packaged = process.argv.includes('--packaged');
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const app = await electron.launch(packaged
  ? { executablePath: path.resolve(`release/v${version}/win-unpacked/团子小屋.exe`), args: [`--user-data-dir=${env.GARDEN_TEST_DATA}`], env }
  : { args: [process.cwd()], env });
const client = new Client({ name: 'dango-house-e2e', version: '1.0.0' });
const report = { checks: [], errors: [], packaged };
try {
  await app.firstWindow();
  let main;
  for (let i = 0; i < 100 && !main; i++) { main = app.windows().find(p => p.url().includes('view=chat')); if (!main) await new Promise(r => setTimeout(r, 100)); }
  assert.ok(main);
  main.on('pageerror', error => report.errors.push(error.message));
  await main.waitForSelector('.room-character');
  await main.evaluate(async () => {
    await window.garden.dispatch({ type: 'settings', patch: { autonomous: false, mode: 'demo' } });
    await window.garden.dispatch({ type: 'room-settings', patch: { autonomous: false, wandering: false } });
  });
  const status = await main.evaluate(port => window.garden.bridgeConfigure({ enabled: true, port }), port);
  assert.ok(status.running);
  assert.equal((await fetch(status.baseUrl + '/v1/snapshot')).status, 401);
  report.checks.push('unauthenticated REST requests rejected');
  assert.ok(fs.existsSync(status.mcpEntry), 'exported MCP entry exists outside asar');
  const transport = new StdioClientTransport({ command: process.execPath, args: [status.mcpEntry], env: { ...env, GARDEN_BRIDGE_FILE: status.bridgeFile }, stderr: 'pipe' });
  await client.connect(transport);
  report.checks.push('official MCP SDK initialize and stdio handshake');
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 10);
  report.checks.push('all 10 tools discovered');
  const call = async (name, args = {}) => {
    const result = await client.callTool({ name, arguments: args });
    assert.ok(!result.isError);
    return JSON.parse(result.content[0].text);
  };
  const snapshot = await call('garden_get_snapshot');
  assert.equal(snapshot.residents.length, 7);
  assert.ok(!('connections' in snapshot));
  assert.ok(!JSON.stringify(snapshot).includes(status.token));
  assert.equal((await call('garden_list_characters')).length, 7);
  report.checks.push('seven residents readable without credentials or token');
  const before = await main.evaluate(() => window.garden.getState());
  await call('garden_pat', { id: 'xia' });
  await call('garden_feed', { id: 'xia', food: 'rice' });
  await call('garden_praise', { id: 'xia' });
  const after = await main.evaluate(() => window.garden.getState());
  assert.ok(after.affection.xia > before.affection.xia);
  report.checks.push('pat, rice feeding and praise change real app affection');
  await call('garden_perform', { id: 'xia', action: 'wave', bubble: 'MCP 联动测试成功' });
  const performed = await main.evaluate(() => window.garden.getState());
  assert.equal(performed.bodies.xia.pose, 'wave');
  report.checks.push('external MCP action reaches the avatar state');
  await assert.rejects(() => call('garden_pat', { id: 'unknown' }));
  await assert.rejects(() => call('unknown_tool'));
  report.checks.push('invalid residents and unknown tools rejected');
  await main.screenshot({ path: path.join(out, 'mcp-connected.png'), scale: 'css' });
  await main.evaluate(() => window.garden.bridgeConfigure({ enabled: false }));
  await assert.rejects(() => call('garden_get_snapshot'));
  report.checks.push('disabling bridge revokes access');
  assert.deepEqual(report.errors, []);
  report.success = true;
} catch (error) {
  report.success = false; report.failure = error.message; process.exitCode = 1; console.error(error);
} finally {
  await client.close().catch(() => {});
  await app.close();
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
