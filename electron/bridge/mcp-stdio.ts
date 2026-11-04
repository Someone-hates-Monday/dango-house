/**
 * Stdio MCP adapter for Cursor / Claude Desktop / Codex.
 * Proxies to the running Dango House HTTP bridge (app must be open with bridge enabled).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { bridgeTools, type BridgeFile } from '../../src/shared/bridge';

type JsonRpcId = string | number | null;

function readBridgeFile(): BridgeFile {
  const file =
    process.env.GARDEN_BRIDGE_FILE ||
    path.join(process.env.APPDATA || process.env.HOME || '', 'Qiting', 'bridge.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Bridge file not found: ${file}. Open 团子小屋 → Settings → enable Agent Bridge.`);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as BridgeFile;
  if (!data?.enabled || !data.token || !data.port || data.host !== '127.0.0.1') {
    throw new Error('Agent Bridge is disabled. Enable it in 团子小屋 settings while the app is running.');
  }
  return data;
}

async function bridgeFetch(pathname: string, init?: RequestInit) {
  const cfg = readBridgeFile();
  const url = `http://${cfg.host}:${cfg.port}${pathname}`;
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok || body.ok === false) {
    throw new Error(String(body.error || `HTTP ${res.status}`));
  }
  return body;
}

function sendMessage(message: Record<string, unknown>) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function okResult(data: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

async function handleRequest(msg: { id?: JsonRpcId; method?: string; params?: Record<string, unknown> }) {
  const method = msg.method || '';
  if (method === 'initialize') {
    return {
      protocolVersion: ['2024-11-05','2025-03-26','2025-06-18'].includes(String(msg.params?.protocolVersion)) ? String(msg.params?.protocolVersion) : '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'dango-house', version: '0.3.9' },
      instructions:
        'Dango House companion stage plugin. The Electron app must be running with Agent Bridge enabled. Use tools to act through the seven AI companions; do not invent browser URLs or claim visual understanding the house did not report.',
    };
  }
  if (method === 'notifications/initialized' || method === 'initialized') return null;
  if (method === 'tools/list') {
    return {
      tools: bridgeTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  }
  if (method === 'tools/call') {
    const name = String(msg.params?.name || '');
    const args = (msg.params?.arguments && typeof msg.params.arguments === 'object'
      ? msg.params.arguments
      : {}) as Record<string, unknown>;
    if (name === 'garden_get_snapshot') {
      const body = await bridgeFetch('/v1/snapshot');
      return okResult(body.snapshot);
    }
    const call = await bridgeFetch('/v1/call', {
      method: 'POST',
      body: JSON.stringify({ name, arguments: args }),
    });
    return okResult(call.result ?? call);
  }
  if (method === 'ping') return {};
  throw new Error(`Unsupported MCP method: ${method}`);
}

// MCP stdio uses newline-delimited UTF-8 JSON, not LSP Content-Length frames.
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
lines.on('line', line => {
  queue = queue.then(async () => {
    if (!line.trim()) return;
    if (Buffer.byteLength(line, 'utf8') > 1024 * 1024) return;
    const body = line;
    let msg: { id?: JsonRpcId; method?: string; params?: Record<string, unknown> };
    try {
      msg = JSON.parse(body);
    } catch {
      return;
    }
    if (!msg.method) return;
    if (msg.id === undefined || msg.id === null) {
      try {
        await handleRequest(msg);
      } catch {
        /* notifications: ignore failures */
      }
      return;
    }
    try {
      const result = await handleRequest(msg);
      if (result !== null) sendMessage({ jsonrpc: '2.0', id: msg.id, result });
    } catch (error) {
      sendMessage({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32000, message: error instanceof Error ? error.message : 'bridge_error' },
      });
    }
  }).catch(error => { process.stderr.write(String(error) + '\n'); });
});
lines.on('close', () => { void queue.finally(() => process.exit(0)); });
process.stderr.write('dango-house MCP bridge ready (stdio)\n');
