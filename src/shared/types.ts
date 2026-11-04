import type { AgentUiState } from './agent';
import type { BridgeStatus } from './bridge';
import type { AppLocale } from './i18n';
export type { BridgeStatus } from './bridge';
export type CharacterId = 'xia' | 'rin' | 'shiori' | 'gemini' | 'glm' | 'kimi' | 'grok';
export type { AppLocale };
export type Mood = 'idle' | 'happy' | 'talk' | 'focus';
export interface Character { id: CharacterId; name: string; subtitle: string; color: string; pale: string; file: string; personality: string; tags: string[]; greeting: string; source: string; atlas?: boolean; }
export interface Message { id: string; speaker: CharacterId | 'user' | 'system'; text: string; at: number; kind?: 'error' | 'notice'; }
export interface Memory { id: string; text: string; at: number; }
export interface PetState { x: number; y: number; displayId: number; }
export interface FocusTask { id: string; endAt: number; minutes: number; owner: CharacterId; }
export type Pose = 'idle' | 'walk-right' | 'walk-left' | 'wave' | 'jump' | 'sad' | 'wait' | 'think' | 'read';
export type Emotion = 'neutral' | 'happy' | 'shy' | 'sad' | 'curious';
export interface Embodiment { pose: Pose; emotion: Emotion; until: number; label: string; bubble: string; interaction?: import('./motion').Interaction; stoppedAt?:number; }
export interface RoomPoint { x: number; y: number; }
export type FurnitureKind = 'sofa' | 'table' | 'bookshelf' | 'plant' | 'lamp' | 'cushion';
export interface Furniture extends RoomPoint { id: string; kind: FurnitureKind; }
export interface RoomResident extends RoomPoint { from: RoomPoint; startedAt: number; arrivesAt: number; after: Pose; destination: string; }
export interface AvatarIntent { action: string; emotion?: Emotion; target?: string; x?: number; y?: number; duration?: number; bubble?: string; }
export type Food = 'rice'|'cake'|'fish'|'tea';
export type PairTone = 'soft' | 'warm' | 'vivid';
export type CastPreset = 'all' | 'core' | 'custom';
export interface ConnectionProfile { model: string; endpoint: string; tools: boolean; }
export interface FavorState { focusId: CharacterId | null; streak: number; }
export interface AppState {
  version: 1; messages: Message[]; selected: CharacterId; muted: CharacterId[];
  affection: Record<CharacterId, number>; mood: Record<CharacterId, Mood>; pets: Partial<Record<CharacterId, PetState>>;
  skins: Record<CharacterId, 'chibi' | 'animated'>;
  bodies: Record<CharacterId, Embodiment>;
  room: { residents: Record<CharacterId, RoomResident>; furniture: Furniture[]; theme: 'peach' | 'night'; autonomous: boolean; wandering: boolean; log: { id: string; actor: CharacterId; text: string; at: number; source: 'local' | 'model' }[] };
  connections: Record<string, ConnectionProfile>;
  /** Optional per-character provider override; unset entries use the house-brain provider. */
  characterProviders: Partial<Record<CharacterId, string>>;
  presentation: {desktopMode:'free'|'dock';chatForm:'portrait'|'chibi'};
  privateMessages: Record<CharacterId, Message[]>;
  relationship: { mode: 'friend'|'pet'|'romance'; userName: string; address: string };
  desktopMoves: Partial<Record<CharacterId,{from:RoomPoint;to:RoomPoint;startedAt:number;arrivesAt:number;displayId:number}>>;
  bonds: Record<string,number>;
  favor: FavorState;
  reminders: {id:string;text:string;intervalMinutes:number;nextAt:number;enabled:boolean}[];
  settings: {
    dnd: boolean;
    autonomous: boolean;
    intimacy: number;
    petsVisible: boolean;
    provider: string;
    model: string;
    mode: 'demo' | 'api';
    locale: AppLocale;
    pairTone: PairTone;
    /** Optional localhost Agent Bridge for Cursor/Claude/Codex plugins; app remains the primary product. */
    agentBridge: boolean;
    /** Today’s cast size preset; muted[] is the source of truth for who may speak. */
    castPreset: CastPreset;
  };
  memories: Memory[]; focus: FocusTask | null;
  agent: AgentUiState;
  activity: string; busy: boolean; revision: number;
}
export type Action =
  | {type:'play-clip';id:CharacterId;clipId?:string;group?:string}
  | {type:'companion-visit';id:CharacterId;target:CharacterId}
  | {type:'presentation';patch:Partial<AppState['presentation']>}
  | { type: 'send'; text: string; target?: CharacterId }
  | { type: 'watch-start'; path: string; displayName?: string; captionPath?: string; speakers?: CharacterId[] }
  | { type: 'browse-start'; query: string; maxResults?: number; actor?: CharacterId }
  | { type: 'agent-control'; id: string; command: 'pause' | 'resume' | 'cancel' }
  | { type: 'watch-clear' }
  | { type: 'yuri-scene'; id: string }
  | { type: 'select'; id: CharacterId }
  | { type: 'private-open'; id: CharacterId }
  | { type: 'private-send'; id: CharacterId; text: string }
  | { type: 'relationship'; mode:'friend'|'pet'|'romance'; userName:string; address:string }
  | { type: 'pat'; id:CharacterId }
  | { type: 'trip'; id:CharacterId }
  | { type: 'feed'; id:CharacterId; food:Food }
  | { type: 'hover'; id:CharacterId }
  | { type: 'reminder'; operation:'add'|'remove'|'toggle'; id?:string; text?:string; intervalMinutes?:number }
  | { type: 'perform'; id: CharacterId; intent: AvatarIntent }
  | { type: 'social-scene'; id: string }
  | { type: 'showcase'; scene: 'welcome' | 'tea' | 'rivalry' }
  | { type: 'room-settings'; patch: { autonomous?: boolean; wandering?: boolean; theme?: 'peach' | 'night' } }
  | { type: 'furniture'; operation: 'add' | 'move' | 'remove' | 'reset'; id?: string; kind?: FurnitureKind; x?: number; y?: number }
  | { type: 'connection'; provider: string; profile: ConnectionProfile }
  | { type: 'skin'; id: CharacterId; skin: 'chibi' | 'animated' }
  | { type: 'praise'; id: CharacterId }
  | { type: 'mute'; id: CharacterId }
  | { type: 'cast-preset'; preset: CastPreset }
  | { type: 'character-provider'; id: CharacterId; provider: string | null }
  | { type: 'settings'; patch: Partial<AppState['settings']> }
  | { type: 'focus'; minutes: number }
  | { type: 'cancel-focus' }
  | { type: 'banter' }
  | { type: 'stop' }
  | { type: 'remember'; text: string }
  | { type: 'forget'; id: string }
  | { type: 'clear-chat' }
  | { type: 'move'; id: CharacterId; x: number; y: number; displayId: number };
export interface DesktopBridge {
  getState(): Promise<AppState>;
  dispatch(action: Action): Promise<void>;
  subscribe(callback: (state: AppState) => void): () => void;
  window(command: 'minimize' | 'close' | 'show-chat' | 'quit'): void;
  hitTest(interactive: boolean): void;
  openPrivate(id: CharacterId): void;
  saveKey(provider: string, key: string): Promise<void>;
  keyStatus(): Promise<string[]>;
  testConnection(provider: string, model: string, endpoint?: string): Promise<string>;
  pickVideo(): Promise<{ path: string; displayName: string; captionPath?: string } | null>;
  bridgeStatus(): Promise<BridgeStatus>;
  bridgeConfigure(patch: { enabled?: boolean; port?: number; rotateToken?: boolean }): Promise<BridgeStatus>;
  bridgeInstallSnippet(target: 'cursor' | 'claude' | 'codex' | 'deepseek'): Promise<string>;
}
declare global { interface Window { garden: DesktopBridge; } }
