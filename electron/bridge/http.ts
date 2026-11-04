import http from 'node:http';
import type { Action, AppState } from '../../src/shared/types';
import {
  actionFromBridgeTool,
  bridgeTools,
  buildAgentSnapshot,
  type BridgeFile,
} from '../../src/shared/bridge';

export interface BridgeHost {
  getState(): AppState;
  dispatch(action: Action): Promise<void>;
}

export class GardenBridgeServer {
  private server: http.Server | null = null;
  private lastError = '';

  constructor(
    private host: BridgeHost,
    private getConfig: () => BridgeFile,
  ) {}

  get running() {
    return !!this.server?.listening;
  }

  get error() {
    return this.lastError;
  }

  async start() {
    const config = this.getConfig();
    if (!config.enabled) {
      await this.stop();
      return;
    }
    if (this.server?.listening) await this.stop();
    this.lastError = '';

    this.server = http.createServer((req, res) => {
      void this.handle(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', err => {
        this.lastError = err.message;
        this.server = null;
        reject(err);
      });
      this.server!.listen(config.port, config.host, () => resolve());
    });
  }

  async stop() {
    const server = this.server;
    this.server = null;
    if (!server) return;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }

  private unauthorized(res: http.ServerResponse) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
  }

  private json(res: http.ServerResponse, status: number, body: unknown) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(body));
  }

  private authed(req: http.IncomingMessage) {
    const config = this.getConfig();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    return !!config.token && token === config.token;
  }

  private async readBody(req: http.IncomingMessage) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  }

  private async handle(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      const url = new URL(req.url || '/', `http://${this.getConfig().host}`);
      if (req.method === 'GET' && url.pathname === '/health') {
        return this.json(res, 200, {
          ok: true,
          app: 'dango-house',
          role: 'companion-stage',
          bridge: true,
          running: true,
        });
      }

      if (!this.authed(req)) return this.unauthorized(res);

      if (req.method === 'GET' && url.pathname === '/v1/snapshot') {
        return this.json(res, 200, { ok: true, snapshot: buildAgentSnapshot(this.host.getState()) });
      }
      if (req.method === 'GET' && url.pathname === '/v1/tools') {
        return this.json(res, 200, { ok: true, tools: bridgeTools });
      }
      if (req.method === 'POST' && url.pathname === '/v1/call') {
        const body = await this.readBody(req);
        const name = String(body.name || '');
        const args = (body.arguments && typeof body.arguments === 'object' ? body.arguments : {}) as Record<string, unknown>;
        const result = await this.callTool(name, args);
        return this.json(res, result.ok ? 200 : 400, result);
      }

      this.json(res, 404, { ok: false, error: 'not_found' });
    } catch (error) {
      this.json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'bridge_error' });
    }
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (name === 'garden_get_snapshot') {
      return { ok: true, result: buildAgentSnapshot(this.host.getState()) };
    }
    if (name === 'garden_list_characters') {
      const state = this.host.getState();
      return {
        ok: true,
        result: buildAgentSnapshot(state).residents.map(r => ({ id: r.id, name: r.name, muted: r.muted })),
      };
    }
    try {
      const action = actionFromBridgeTool(name, args);
      await this.host.dispatch(action);
      return { ok: true, result: { accepted: true, action: action.type, snapshot: buildAgentSnapshot(this.host.getState()) } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'call_failed' };
    }
  }
}
