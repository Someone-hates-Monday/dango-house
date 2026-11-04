import type { Action, AppState, CharacterId, Food } from './types';
import { characters } from './characters';
import { stickiestPair } from './bonds';

export const BRIDGE_DEFAULT_PORT = 3927;

export interface BridgeFile {
  version: 1;
  enabled: boolean;
  host: '127.0.0.1';
  port: number;
  token: string;
  updatedAt: number;
}

export interface BridgeStatus {
  enabled: boolean;
  running: boolean;
  host: string;
  port: number;
  token: string;
  baseUrl: string;
  bridgeFile: string;
  mcpEntry: string;
  error?: string;
}

export interface AgentSnapshot {
  activity: string;
  busy: boolean;
  dnd: boolean;
  locale: string;
  pairTone: string;
  relationship: AppState['relationship'];
  favor: AppState['favor'];
  selected: CharacterId;
  muted: CharacterId[];
  stickiest: { a: CharacterId; b: CharacterId; value: number } | null;
  residents: Array<{
    id: CharacterId;
    name: string;
    affection: number;
    mood: string;
    muted: boolean;
  }>;
  recentMessages: Array<{ speaker: string; text: string; at: number }>;
  agentTasks: Array<{ id: string; kind: string; status: string; goal: string }>;
  watchParty: AppState['agent']['watchParty'];
}

export interface BridgeToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const bridgeTools: BridgeToolDef[] = [
  {
    name: 'garden_get_snapshot',
    description: 'Read a safe companion-house snapshot (moods, favor, bonds highlight, recent chat, agent tasks). No API keys.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'garden_list_characters',
    description: 'List the seven residents with ids and display names.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'garden_say_as_user',
    description: 'Send a user chat message into the house (optional @target character id).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 2000 },
        target: { type: 'string', description: 'Optional character id' },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_perform',
    description: 'Ask a resident to perform a short avatar action with optional bubble text.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        action: { type: 'string' },
        emotion: { type: 'string' },
        bubble: { type: 'string' },
        duration: { type: 'number' },
      },
      required: ['id', 'action'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_praise',
    description: 'Praise a resident (raises favor streak / rivalry loop).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_pat',
    description: 'Gently pat a resident.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_feed',
    description: 'Feed a resident rice|cake|fish|tea.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        food: { type: 'string', enum: ['rice', 'cake', 'fish', 'tea'] },
      },
      required: ['id', 'food'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_play_scene',
    description: 'Play a social group scene or yuri pair scene by id.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['social', 'yuri', 'showcase'] },
        id: { type: 'string', description: 'Scene id, or welcome|tea|rivalry for showcase' },
      },
      required: ['kind', 'id'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_browse_videos',
    description: 'Start a visible browse task; only verified opened URLs become recommendations. Requires the house app to be running.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 200 },
        maxResults: { type: 'number' },
        actor: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'garden_agent_control',
    description: 'Pause, resume, or cancel an agent task by id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        command: { type: 'string', enum: ['pause', 'resume', 'cancel'] },
      },
      required: ['id', 'command'],
      additionalProperties: false,
    },
  },
];

const characterIds = new Set(characters.map(c => c.id));

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && characterIds.has(value as CharacterId);
}

export function buildAgentSnapshot(state: AppState): AgentSnapshot {
  const sticky = stickiestPair(state.bonds, state.muted);
  return {
    activity: state.activity,
    busy: state.busy,
    dnd: state.settings.dnd,
    locale: state.settings.locale,
    pairTone: state.settings.pairTone,
    relationship: state.relationship,
    favor: state.favor,
    selected: state.selected,
    muted: [...state.muted],
    stickiest: sticky,
    residents: characters.map(c => ({
      id: c.id,
      name: c.name,
      affection: state.affection[c.id] ?? 0,
      mood: state.mood[c.id] ?? 'idle',
      muted: state.muted.includes(c.id),
    })),
    recentMessages: state.messages.slice(-12).map(m => ({ speaker: m.speaker, text: m.text, at: m.at })),
    agentTasks: state.agent.tasks.map(t => ({ id: t.id, kind: t.kind, status: t.status, goal: t.goal })),
    watchParty: state.agent.watchParty,
  };
}

export function actionFromBridgeTool(name: string, args: Record<string, unknown>): Action {
  switch (name) {
    case 'garden_say_as_user': {
      const text = String(args.text ?? '').trim();
      if (!text) throw new Error('text is required');
      const target = isCharacterId(args.target) ? args.target : undefined;
      return { type: 'send', text, target };
    }
    case 'garden_perform': {
      if (!isCharacterId(args.id)) throw new Error('invalid character id');
      return {
        type: 'perform',
        id: args.id,
        intent: {
          action: String(args.action || 'wave'),
          emotion: typeof args.emotion === 'string' ? (args.emotion as any) : undefined,
          bubble: typeof args.bubble === 'string' ? args.bubble.slice(0, 120) : undefined,
          duration: Number.isFinite(args.duration) ? Number(args.duration) : undefined,
        },
      };
    }
    case 'garden_praise': {
      if (!isCharacterId(args.id)) throw new Error('invalid character id');
      return { type: 'praise', id: args.id };
    }
    case 'garden_pat': {
      if (!isCharacterId(args.id)) throw new Error('invalid character id');
      return { type: 'pat', id: args.id };
    }
    case 'garden_feed': {
      if (!isCharacterId(args.id)) throw new Error('invalid character id');
      const food = args.food as Food;
      if (!['rice', 'cake', 'fish', 'tea'].includes(food)) throw new Error('invalid food');
      return { type: 'feed', id: args.id, food };
    }
    case 'garden_play_scene': {
      const kind = String(args.kind);
      const id = String(args.id || '');
      if (kind === 'social') return { type: 'social-scene', id };
      if (kind === 'yuri') return { type: 'yuri-scene', id };
      if (kind === 'showcase' && (id === 'welcome' || id === 'tea' || id === 'rivalry')) {
        return { type: 'showcase', scene: id };
      }
      throw new Error('invalid scene');
    }
    case 'garden_browse_videos': {
      const query = String(args.query ?? '').trim();
      if (!query) throw new Error('query is required');
      return {
        type: 'browse-start',
        query,
        maxResults: Number.isFinite(args.maxResults) ? Number(args.maxResults) : 2,
        actor: isCharacterId(args.actor) ? args.actor : undefined,
      };
    }
    case 'garden_agent_control': {
      const id = String(args.id || '');
      const command = args.command;
      if (!id || (command !== 'pause' && command !== 'resume' && command !== 'cancel')) {
        throw new Error('invalid agent control');
      }
      return { type: 'agent-control', id, command };
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export function newBridgeToken() {
  const bytes = new Uint8Array(24);
  const webcrypto = globalThis.crypto;
  if (!webcrypto?.getRandomValues) throw new Error('crypto unavailable');
  webcrypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function cursorMcpConfig(mcpEntry: string, bridgeFile: string) {
  return {
    mcpServers: {
      'dango-house': {
        command: 'node',
        args: [mcpEntry],
        env: { GARDEN_BRIDGE_FILE: bridgeFile },
      },
    },
  };
}

export function claudeDesktopMcpConfig(mcpEntry: string, bridgeFile: string) {
  return cursorMcpConfig(mcpEntry, bridgeFile);
}

export function codexMcpToml(mcpEntry: string, bridgeFile: string) {
  const esc = (s: string) => s.replace(/\\/g, '/');
  return `[mcp_servers.dango_house]
command = "node"
args = ["${esc(mcpEntry)}"]
env = { GARDEN_BRIDGE_FILE = "${esc(bridgeFile)}" }
`;
}

export function deepseekHarnessHint(baseUrl: string, token: string) {
  return {
    kind: 'rest',
    baseUrl,
    headers: { Authorization: `Bearer ${token}` },
    endpoints: {
      health: 'GET /health',
      snapshot: 'GET /v1/snapshot',
      tools: 'GET /v1/tools',
      call: 'POST /v1/call  { "name": "garden_get_snapshot", "arguments": {} }',
    },
    note: 'Keep the Dango House app running with Agent Bridge enabled. This is a stage/body plugin, not a replacement for the harness planner.',
  };
}
