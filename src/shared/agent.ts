import type { CharacterId, Emotion } from './types';

/** Task identifiers stay opaque strings so the renderer never owns execution handles. */
export type TaskId = string;
export type EvidenceId = string;

export type TaskKind = 'watch_party' | 'browse' | 'outing' | 'generic';
export type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/** Honest observation coverage — never imply vision from captions alone. */
export type ObservationCoverage =
  | 'metadata_only'
  | 'transcript_only'
  | 'sampled_av'
  | 'native_video'
  | 'stream_partial';

export type ToolOutcome = 'success' | 'blocked' | 'failed' | 'cancelled' | 'unknown_tool';

export interface TaskBudget {
  maxSteps: number;
  maxMs: number;
  maxMediaSeconds: number;
  maxSpeakers: number;
  maxDiscussionTurns: number;
}

export interface TaskUsage {
  steps: number;
  startedAt: number;
  endedAt?: number;
  mediaSeconds?: number;
  tokensIn?: number;
  tokensOut?: number;
  costKnown: boolean;
}

export interface TaskRequest {
  kind: TaskKind;
  goal: string;
  actor?: CharacterId;
  speakers?: CharacterId[];
  grants: string[];
  budget?: Partial<TaskBudget>;
  source?: MediaSourceRef;
  channel?: 'group' | 'private';
  privateId?: CharacterId;
}

export interface MediaSourceRef {
  kind: 'local_file' | 'url';
  /** Absolute path for local files, or URL string. Never send credentials here. */
  value: string;
  displayName?: string;
  sidecarCaptionPath?: string;
}

export interface TimeRange {
  startMs: number;
  endMs: number;
}

export interface VisualFact {
  id: string;
  atMs?: number;
  text: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AudioFact {
  id: string;
  range?: TimeRange;
  text: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface EvidenceSegment {
  id: string;
  range: TimeRange;
  transcript?: string;
  visualFacts: VisualFact[];
  audioFacts: AudioFact[];
}

export interface VideoEvidence {
  id: EvidenceId;
  canonicalId: string;
  canonicalUrl?: string;
  title: string;
  creator?: string;
  durationMs?: number;
  coverage: ObservationCoverage;
  observedRanges: TimeRange[];
  analysisVersion: string;
  sourceFingerprint: string;
  segments: EvidenceSegment[];
  limitations: string[];
  uncertainties: string[];
  createdAt: number;
  /** Absolute path inside the app media cache, if copied. */
  localPath?: string;
}

export interface CharacterOpinion {
  id: string;
  characterId: CharacterId;
  evidenceIds: EvidenceId[];
  reaction: string;
  interpretation: string;
  cite?: { segmentId?: string; atMs?: number; factIds?: string[] };
  interestsDelta?: string[];
}

export interface RecommendationCard {
  id: string;
  verifiedUrl: string;
  title: string;
  creator?: string;
  whyForUser: string;
  endorsedBy: CharacterId[];
  evidenceLevel: 'metadata_candidate' | 'inspected' | 'watched';
  sourceQuery?: string;
}

export interface ToolReceipt {
  id: string;
  tool: string;
  outcome: ToolOutcome;
  summary: string;
  evidenceIds?: EvidenceId[];
  details?: Record<string, unknown>;
  at: number;
}

export type TaskEventKind =
  | 'task_started'
  | 'task_progress'
  | 'tool_receipt'
  | 'evidence_ready'
  | 'opinion_ready'
  | 'discussion_turn'
  | 'recommendation_ready'
  | 'task_completed'
  | 'task_failed'
  | 'task_cancelled'
  | 'coverage_notice';

export interface TaskEvent {
  id: string;
  taskId: TaskId;
  kind: TaskEventKind;
  at: number;
  message: string;
  actor?: CharacterId;
  emotion?: Emotion;
  actionHint?: string;
  evidenceId?: EvidenceId;
  receipt?: ToolReceipt;
  opinion?: CharacterOpinion;
  recommendation?: RecommendationCard;
  coverage?: ObservationCoverage;
  progress?: number;
}

export interface AgentTaskSummary {
  id: TaskId;
  kind: TaskKind;
  goal: string;
  status: TaskStatus;
  actor?: CharacterId;
  speakers: CharacterId[];
  createdAt: number;
  updatedAt: number;
  progress: number;
  coverage?: ObservationCoverage;
  lastMessage: string;
  budget: TaskBudget;
  usage: TaskUsage;
  error?: string;
}

export interface WatchPartyState {
  taskId: TaskId;
  evidenceId?: EvidenceId;
  title: string;
  coverage?: ObservationCoverage;
  limitations: string[];
  speakers: CharacterId[];
  opinions: CharacterOpinion[];
  turns: { speaker: CharacterId; text: string; at: number; replyTo?: string }[];
  recommendations: RecommendationCard[];
  status: TaskStatus;
}

export interface AgentUiState {
  tasks: AgentTaskSummary[];
  activeTaskId: TaskId | null;
  watchParty: WatchPartyState | null;
  /** Latest events for the tray / room log (bounded). */
  events: TaskEvent[];
}

export const defaultTaskBudget = (): TaskBudget => ({
  maxSteps: 24,
  maxMs: 5 * 60_000,
  maxMediaSeconds: 180,
  maxSpeakers: 3,
  maxDiscussionTurns: 6,
});

export const emptyAgentUi = (): AgentUiState => ({
  tasks: [],
  activeTaskId: null,
  watchParty: null,
  events: [],
});

export function coverageLabel(coverage: ObservationCoverage, locale: 'zh-CN' | 'en' | 'ja' | boolean = 'zh-CN'): string {
  const zh: Record<ObservationCoverage, string> = {
    metadata_only: '仅元数据',
    transcript_only: '仅字幕/转录',
    sampled_av: '抽帧+音轨采样',
    native_video: '原生视频接口',
    stream_partial: '实时片段',
  };
  const en: Record<ObservationCoverage, string> = {
    metadata_only: 'metadata only',
    transcript_only: 'transcript only',
    sampled_av: 'sampled frames + audio',
    native_video: 'native video API',
    stream_partial: 'partial stream window',
  };
  const ja: Record<ObservationCoverage, string> = {
    metadata_only: 'メタデータのみ',
    transcript_only: '字幕/文字起こしのみ',
    sampled_av: 'フレーム抽出+音声',
    native_video: 'ネイティブ動画API',
    stream_partial: 'リアルタイム断片',
  };
  if (locale === true) return `${zh[coverage]} / ${en[coverage]}`;
  if (locale === false || locale === 'zh-CN') return zh[coverage];
  if (locale === 'ja') return ja[coverage];
  return en[coverage];
}
