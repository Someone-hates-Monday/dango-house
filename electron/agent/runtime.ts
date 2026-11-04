import fs from 'node:fs';
import path from 'node:path';
import type { CharacterId } from '../../src/shared/types';
import {
  type AgentTaskSummary,
  type AgentUiState,
  type MediaSourceRef,
  type RecommendationCard,
  type TaskBudget,
  type TaskEvent,
  type TaskId,
  type TaskRequest,
  type ToolReceipt,
  type VideoEvidence,
  type WatchPartyState,
  coverageLabel,
  defaultTaskBudget,
  emptyAgentUi,
} from '../../src/shared/agent';
import { ToolRegistry, type ToolContext } from './tools';
import { importLocalVideo, resolveUrlSource } from '../media/source';
import { evidenceBrief, perceiveLocalVideo } from '../media/perceive';
import {
  assertSpeakerPool,
  chooseWatchSpeakers,
  draftIndependentOpinions,
  planDiscussionTurns,
  silentListeners,
} from '../social/discussion';
import { byId } from '../../src/shared/characters';
import { ids } from '../../src/shared/director';
import type { AppLocale } from '../../src/shared/i18n';
import { defaultLocale } from '../../src/shared/i18n';
import { agentCopy } from '../../src/shared/dialogue/pack';
import { browseForVideos, hitsToCards } from './browse';
import { mergeVisionIntoEvidence, sampleVisualFacts } from '../media/vision';

export interface RuntimeHooks {
  notify(ui: AgentUiState): void;
  perform(id: CharacterId, intent: { action: string; emotion?: string; bubble?: string; target?: string; duration?: number }, source?: 'local' | 'model'): string;
  say(speaker: CharacterId | 'system', text: string, kind?: 'error' | 'notice'): void;
  activeCharacters(): CharacterId[];
  mediaCacheDir: string;
  locale?: () => AppLocale;
}

interface InternalTask {
  summary: AgentTaskSummary;
  request: TaskRequest;
  controller: AbortController;
  evidence?: VideoEvidence;
  receipts: ToolReceipt[];
  events: TaskEvent[];
  paused: boolean;
}

export class AgentRuntime {
  private tasks = new Map<TaskId, InternalTask>();
  private evidence = new Map<string, VideoEvidence>();
  private ui: AgentUiState = emptyAgentUi();
  readonly tools = new ToolRegistry();

  constructor(private hooks: RuntimeHooks) {
    this.registerDefaultTools();
  }
  private L(): AppLocale { return this.hooks.locale?.() ?? defaultLocale; }
  private a(key: string, vars?: Record<string, string | number>) { return agentCopy(this.L(), key, vars); }

  getUi(): AgentUiState {
    return this.ui;
  }

  getEvidence(id: string) {
    return this.evidence.get(id);
  }

  private publish() {
    this.ui = {
      tasks: [...this.tasks.values()].map(t => t.summary).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20),
      activeTaskId: this.ui.activeTaskId,
      watchParty: this.ui.watchParty,
      events: this.ui.events.slice(-40),
    };
    this.hooks.notify(this.ui);
  }

  private pushEvent(taskId: TaskId, partial: Omit<TaskEvent, 'id' | 'taskId' | 'at'> & { at?: number }) {
    const event: TaskEvent = {
      id: crypto.randomUUID(),
      taskId,
      at: partial.at ?? Date.now(),
      kind: partial.kind,
      message: partial.message,
      actor: partial.actor,
      emotion: partial.emotion,
      actionHint: partial.actionHint,
      evidenceId: partial.evidenceId,
      receipt: partial.receipt,
      opinion: partial.opinion,
      recommendation: partial.recommendation,
      coverage: partial.coverage,
      progress: partial.progress,
    };
    const task = this.tasks.get(taskId);
    if (task) {
      task.events.push(event);
      task.summary.lastMessage = event.message;
      task.summary.updatedAt = event.at;
      if (partial.progress !== undefined) task.summary.progress = partial.progress;
      if (partial.coverage) task.summary.coverage = partial.coverage;
    }
    this.ui.events = [...this.ui.events, event].slice(-40);
    this.publish();
    return event;
  }

  private registerDefaultTools() {
    this.tools.register('import_local_video', 'media.read', this.a('importTool'), async (args, ctx) => {
      const value = String(args.path ?? '');
      const ref: MediaSourceRef = {
        kind: 'local_file',
        value,
        displayName: typeof args.displayName === 'string' ? args.displayName : undefined,
        sidecarCaptionPath: typeof args.captionPath === 'string' ? args.captionPath : undefined,
      };
      const imported = importLocalVideo(ref, this.hooks.mediaCacheDir);
      return {
        summary: this.a('imported', { name: imported.displayName, fp: imported.fingerprint }),
        details: imported,
      };
    });

    this.tools.register('analyze_video', 'media.analyze', this.a('analyzeTool'), async (args, ctx) => {
      const localPath = String(args.localPath ?? '');
      const fingerprint = String(args.fingerprint ?? '');
      const displayName = String(args.displayName ?? path.basename(localPath));
      const size = Number(args.size ?? 0);
      const captionPath = typeof args.captionPath === 'string' ? args.captionPath : undefined;
      const maxMediaSeconds = Number(args.maxMediaSeconds ?? 180);
      if (!localPath || !fs.existsSync(localPath)) throw new Error(this.a('noCache'));
      let evidence = await perceiveLocalVideo({
        localPath,
        fingerprint,
        displayName,
        size,
        captionPath,
        signal: ctx.signal,
        maxMediaSeconds,
      });
      const vision = await sampleVisualFacts({ localPath, signal: ctx.signal, maxFrames: 3 });
      if (vision) evidence = mergeVisionIntoEvidence(evidence, vision);
      this.evidence.set(evidence.id, evidence);
      return {
        summary: this.a('evidenceSummary', { cover: coverageLabel(evidence.coverage, this.L()), limit: evidence.limitations[0] ?? '' }),
        evidenceIds: [evidence.id],
        details: { evidenceId: evidence.id, coverage: evidence.coverage, brief: evidenceBrief(evidence).slice(0, 1200) },
      };
    });

    this.tools.register('resolve_url_video', 'media.url', this.a('resolveTool'), async () => {
      resolveUrlSource({ kind: 'url', value: '' });
      return { summary: 'unreachable' };
    });

    this.tools.register('browse_web_videos', 'browser.navigate', 'Visible Playwright search; only verified opened URLs become recommendations', async (args, ctx) => {
      const query = String(args.query ?? '').trim().slice(0, 160);
      if (!query) throw new Error('missing query');
      const maxResults = Math.max(1, Math.min(Number(args.maxResults ?? 2), 3));
      const profileDir = path.join(this.hooks.mediaCacheDir, 'browser-profile');
      fs.mkdirSync(profileDir, { recursive: true });
      const result = await browseForVideos(query, { signal: ctx.signal, maxResults, profileDir });
      return {
        summary: result.note,
        details: { hits: result.hits, query },
      };
    });
  }

  async start(request: TaskRequest): Promise<TaskId> {
    const budget: TaskBudget = { ...defaultTaskBudget(), ...request.budget };
    const id = crypto.randomUUID();
    const now = Date.now();
    const speakers = chooseWatchSpeakers(this.hooks.activeCharacters(), request.speakers, budget.maxSpeakers);
    assertSpeakerPool(speakers, this.L());
    const summary: AgentTaskSummary = {
      id,
      kind: request.kind,
      goal: request.goal.slice(0, 240),
      status: 'running',
      actor: request.actor ?? speakers[0],
      speakers,
      createdAt: now,
      updatedAt: now,
      progress: 0,
      lastMessage: this.a('claimed'),
      budget,
      usage: { steps: 0, startedAt: now, costKnown: false },
    };
    const controller = new AbortController();
    const task: InternalTask = { summary, request, controller, receipts: [], events: [], paused: false };
    this.tasks.set(id, task);
    this.ui.activeTaskId = id;
    if (request.kind === 'watch_party' || request.kind === 'browse') {
      this.ui.watchParty = {
        taskId: id,
        title: request.source?.displayName || request.goal,
        speakers,
        limitations: request.kind === 'browse' ? ['Browse results only include URLs that actually opened.'] : [],
        opinions: [],
        turns: [],
        recommendations: [],
        status: 'running',
      };
    }
    this.pushEvent(id, { kind: 'task_started', message: this.a('started', { goal: summary.goal }), actor: summary.actor, actionHint: 'think', progress: 0.02 });
    if (summary.actor) {
      try {
        this.hooks.perform(summary.actor, { action: 'think', emotion: 'curious', bubble: this.a('looking'), duration: 6 }, 'local');
      } catch { /* ignore motion mapping misses */ }
    }
    void this.run(id).catch(error => {
      const current = this.tasks.get(id);
      if (!current || current.summary.status === 'cancelled') return;
      current.summary.status = 'failed';
      current.summary.error = error instanceof Error ? error.message : this.a('failed');
      current.summary.usage.endedAt = Date.now();
      this.pushEvent(id, { kind: 'task_failed', message: current.summary.error, progress: current.summary.progress });
      if (this.ui.watchParty?.taskId === id) this.ui.watchParty = { ...this.ui.watchParty, status: 'failed' };
      this.publish();
    });
    return id;
  }

  async control(id: TaskId, command: 'pause' | 'resume' | 'cancel') {
    const task = this.tasks.get(id);
    if (!task) throw new Error(this.a('missing'));
    if (command === 'cancel') {
      task.controller.abort();
      task.summary.status = 'cancelled';
      task.summary.usage.endedAt = Date.now();
      this.pushEvent(id, { kind: 'task_cancelled', message: this.a('cancelledLate'), progress: task.summary.progress });
      if (this.ui.watchParty?.taskId === id) this.ui.watchParty = { ...this.ui.watchParty, status: 'cancelled' };
      this.publish();
      return;
    }
    if (command === 'pause') {
      task.paused = true;
      task.summary.status = 'paused';
      this.pushEvent(id, { kind: 'task_progress', message: this.a('paused'), progress: task.summary.progress });
      return;
    }
    task.paused = false;
    if (task.summary.status === 'paused') task.summary.status = 'running';
    this.pushEvent(id, { kind: 'task_progress', message: this.a('resumed'), progress: task.summary.progress });
  }

  /** Chat stop must not call this — only explicit agent cancel / app quit. */
  cancelAll() {
    for (const id of this.tasks.keys()) {
      const task = this.tasks.get(id);
      if (task && (task.summary.status === 'running' || task.summary.status === 'paused' || task.summary.status === 'queued')) {
        void this.control(id, 'cancel');
      }
    }
  }

  private async waitIfPaused(task: InternalTask) {
    while (task.paused && !task.controller.signal.aborted) {
      await new Promise(r => setTimeout(r, 120));
    }
  }

  private toolContext(task: InternalTask): ToolContext {
    return {
      taskId: task.summary.id,
      signal: task.controller.signal,
      grants: new Set(task.request.grants),
      step: () => {
        task.summary.usage.steps += 1;
      },
      remainingSteps: () => Math.max(0, task.summary.budget.maxSteps - task.summary.usage.steps),
    };
  }

  private async invoke(task: InternalTask, tool: string, args: Record<string, unknown>) {
    await this.waitIfPaused(task);
    if (task.controller.signal.aborted) throw new Error(this.a('cancelled'));
    if (Date.now() - task.summary.usage.startedAt > task.summary.budget.maxMs) throw new Error(this.a('timeout'));
    const receipt = await this.tools.invoke(tool, args, this.toolContext(task));
    task.receipts.push(receipt);
    this.pushEvent(task.summary.id, {
      kind: 'tool_receipt',
      message: `${receipt.tool} · ${receipt.outcome} · ${receipt.summary}`,
      receipt,
      progress: Math.min(0.95, task.summary.progress + 0.08),
    });
    if (receipt.outcome === 'unknown_tool' || receipt.outcome === 'blocked' || receipt.outcome === 'failed') {
      throw new Error(receipt.summary);
    }
    if (receipt.outcome === 'cancelled') throw new Error(this.a('cancelled'));
    return receipt;
  }

  private async run(id: TaskId) {
    const task = this.tasks.get(id);
    if (!task) return;
    if (task.request.kind === 'watch_party') await this.runWatchParty(task);
    else if (task.request.kind === 'browse') await this.runBrowse(task);
    else throw new Error(this.a('unknownKind', { kind: task.request.kind }));
  }

  private async runBrowse(task: InternalTask) {
    const query = task.request.source?.value || task.request.goal;
    const actor = task.summary.actor ?? this.hooks.activeCharacters()[0] ?? 'xia';
    if (actor) {
      try {
        this.hooks.perform(actor, { action: 'think', emotion: 'curious', bubble: this.L() === 'en' ? 'Going out to search~' : this.L() === 'ja' ? '探しに行くね～' : '我去找找看～', duration: 6 }, 'local');
      } catch { /* ignore */ }
    }
    this.pushEvent(task.summary.id, {
      kind: 'task_progress',
      message: this.L() === 'en' ? 'Opening a visible browser…' : this.L() === 'ja' ? '見えるブラウザを開いています…' : '正在打开可见浏览器…',
      actor,
      actionHint: 'walk',
      progress: 0.2,
    });
    const receipt = await this.invoke(task, 'browse_web_videos', {
      query,
      maxResults: Math.min(3, task.summary.budget.maxSteps),
    });
    const hits = (receipt.details?.hits as { url: string; title: string; opened: boolean }[]) ?? [];
    const cards = hitsToCards(hits, actor, query);
    for (const card of cards) {
      this.pushEvent(task.summary.id, {
        kind: 'recommendation_ready',
        message: card.title,
        recommendation: card,
        progress: Math.min(0.9, task.summary.progress + 0.15),
      });
    }
    task.summary.status = 'completed';
    task.summary.progress = 1;
    task.summary.usage.endedAt = Date.now();
    if (this.ui.watchParty?.taskId === task.summary.id) {
      this.ui.watchParty = {
        ...this.ui.watchParty,
        recommendations: cards,
        limitations: [String(receipt.summary)],
        status: 'completed',
      };
    }
    this.hooks.say(
      'system',
      cards.length
        ? (this.L() === 'en'
          ? `Browse done · ${cards.length} verified link(s).`
          : this.L() === 'ja'
            ? `探し終わり · 検証済みリンク ${cards.length} 件。`
            : `找片结束 · ${cards.length} 条已验证链接。`)
        : String(receipt.summary),
      'notice',
    );
    this.pushEvent(task.summary.id, {
      kind: 'task_completed',
      message: receipt.summary,
      progress: 1,
    });
    if (actor) {
      try {
        this.hooks.perform(actor, { action: 'wave', emotion: 'happy', bubble: cards.length ? (this.L()==='en'?'Links are real ones~':this.L()==='ja'?'本物のリンクだよ～':'链接都是真打开过的～') : (this.L()==='en'?'Nothing verified this time.':this.L()==='ja'?'今回は検証できたページなし。':'这次没有验证成功的页面。'), duration: 6 }, 'local');
      } catch { /* ignore */ }
    }
  }

  private async runWatchParty(task: InternalTask) {
    const source = task.request.source;
    if (!source) throw new Error(this.a('noSource'));
    if (source.kind === 'url') {
      await this.invoke(task, 'resolve_url_video', { url: source.value });
      return;
    }

    const imported = await this.invoke(task, 'import_local_video', {
      path: source.value,
      displayName: source.displayName,
      captionPath: source.sidecarCaptionPath,
    });
    const details = imported.details as {
      localPath: string;
      fingerprint: string;
      displayName: string;
      size: number;
      captionPath?: string;
    };

    this.pushEvent(task.summary.id, {
      kind: 'task_progress',
      message: this.a('evidenceBusy'),
      actor: task.summary.actor,
      actionHint: 'read',
      progress: 0.25,
    });

    const analyzed = await this.invoke(task, 'analyze_video', {
      localPath: details.localPath,
      fingerprint: details.fingerprint,
      displayName: details.displayName,
      size: details.size,
      captionPath: details.captionPath,
      maxMediaSeconds: task.summary.budget.maxMediaSeconds,
    });
    const evidenceId = String(analyzed.details?.evidenceId ?? analyzed.evidenceIds?.[0] ?? '');
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) throw new Error(this.a('badEvidence'));
    task.evidence = evidence;

    this.pushEvent(task.summary.id, {
      kind: 'evidence_ready',
      message: this.a('evidenceReady', { cover: coverageLabel(evidence.coverage, this.L()) }),
      evidenceId: evidence.id,
      coverage: evidence.coverage,
      progress: 0.45,
    });
    this.pushEvent(task.summary.id, {
      kind: 'coverage_notice',
      message: evidence.limitations.join(' ') || this.a('coverage', { cover: coverageLabel(evidence.coverage, this.L()) }),
      coverage: evidence.coverage,
      evidenceId: evidence.id,
    });

    const opinions = draftIndependentOpinions(evidence, task.summary.speakers, this.L());
    for (const opinion of opinions) {
      if (task.controller.signal.aborted) throw new Error(this.a('cancelled'));
      await this.waitIfPaused(task);
      this.pushEvent(task.summary.id, {
        kind: 'opinion_ready',
        message: this.a('opinionReady', { name: byId[opinion.characterId].name }),
        actor: opinion.characterId,
        opinion,
        actionHint: 'think',
        emotion: 'curious',
        progress: Math.min(0.7, task.summary.progress + 0.08),
      });
      try {
        this.hooks.perform(opinion.characterId, { action: 'think', emotion: 'curious', bubble: opinion.reaction.slice(0, 40), duration: 5 }, 'local');
      } catch { /* keep going */ }
    }

    const turns = planDiscussionTurns(opinions, task.summary.budget.maxDiscussionTurns, this.L());
    const watchTurns: WatchPartyState['turns'] = [];
    for (const turn of turns) {
      if (task.controller.signal.aborted) throw new Error(this.a('cancelled'));
      await this.waitIfPaused(task);
      await new Promise(r => setTimeout(r, 180));
      if (task.controller.signal.aborted) throw new Error(this.a('cancelled'));
      watchTurns.push({ speaker: turn.speaker, text: turn.text, at: Date.now(), replyTo: turn.replyTo });
      this.hooks.say(turn.speaker, turn.text);
      this.pushEvent(task.summary.id, {
        kind: 'discussion_turn',
        message: turn.text,
        actor: turn.speaker,
        actionHint: turn.actionHint,
        emotion: turn.emotion,
        progress: Math.min(0.9, task.summary.progress + 0.05),
      });
      try {
        this.hooks.perform(
          turn.speaker,
          {
            action: turn.actionHint,
            emotion: turn.emotion,
            bubble: turn.text.slice(0, 42),
            target: turn.actionHint === 'approach' ? turns[0]?.speaker : undefined,
            duration: 7,
          },
          'local',
        );
      } catch { /* ignore */ }
    }

    for (const listener of silentListeners(this.hooks.activeCharacters(), task.summary.speakers).slice(0, 2)) {
      try {
        this.hooks.perform(listener, { action: 'shy', emotion: 'shy', bubble: this.L()==='en'?'I’ll listen…':this.L()==='ja'?'まずは聞いてる…':'我先听着…', duration: 5 }, 'local');
      } catch { /* ignore */ }
    }

    // P1 does not invent browse results. Placeholder cards are explicitly metadata candidates with no URL forgery.
    const recommendations: RecommendationCard[] = [];
    const doneCover = coverageLabel(evidence.coverage, this.L());
    const doneMsg =
      this.L() === 'en'
        ? `Watch party done · ${doneCover}. Real recommendation links need P2 browsing; we will not invent URLs.`
        : this.L() === 'ja'
          ? `観影完了 · ${doneCover}。本物の推薦URLはP2閲覧が必要。モデルでURLは捏造しません。`
          : `共同观影完成 · ${doneCover}。推荐真实链接需要 P2 浏览检索；当前不会由模型编造 URL。`;
    this.hooks.say('system', doneMsg, 'notice');

    task.summary.status = 'completed';
    task.summary.progress = 1;
    task.summary.usage.endedAt = Date.now();
    task.summary.usage.mediaSeconds = evidence.durationMs !== undefined ? evidence.durationMs / 1000 : undefined;
    this.ui.watchParty = {
      taskId: task.summary.id,
      evidenceId: evidence.id,
      title: evidence.title,
      coverage: evidence.coverage,
      limitations: evidence.limitations,
      speakers: task.summary.speakers,
      opinions,
      turns: watchTurns,
      recommendations,
      status: 'completed',
    };
    this.pushEvent(task.summary.id, {
      kind: 'task_completed',
      message: (this.L() === 'en'
        ? `Watch discussion finished (${turns.length} turns; speakers ${task.summary.speakers.map(id => byId[id].name).join(', ')}).`
        : this.L() === 'ja'
          ? `観影トーク終了（${turns.length}ターン、発言 ${task.summary.speakers.map(id => byId[id].name).join('、')}）。`
          : `观影讨论结束（${turns.length} 轮，发言 ${task.summary.speakers.map(id => byId[id].name).join('、')}）。`),
      progress: 1,
      coverage: evidence.coverage,
      evidenceId: evidence.id,
    });
    if (task.summary.actor) {
      try {
        this.hooks.perform(task.summary.actor, { action: 'wave', emotion: 'happy', bubble: this.L()==='en'?'Done—receipts are in the evidence~':this.L()==='ja'?'見終わった、根拠は証拠の中～':'看完啦，依据都在证据里～', duration: 6 }, 'local');
      } catch { /* ignore */ }
    }
  }
}

export function defaultWatchGrants() {
  return ['media.read', 'media.analyze'];
}

export function defaultBrowseGrants() {
  return ['browser.navigate'];
}

export function pickDefaultSpeakers(active: CharacterId[]): CharacterId[] {
  return chooseWatchSpeakers(active.length ? active : [...ids], undefined, 3);
}
