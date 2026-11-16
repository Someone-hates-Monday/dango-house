import type { AvatarIntent, CharacterId, CgAssetId, ReplyOrigin, MessageAddress } from './types';
import type { CompanionEventKind } from './events';

export type ScenePriority = 'user' | 'reaction' | 'idle';

export interface SceneStep extends MessageAddress {
  at: number;
  actor: CharacterId;
  intent: AvatarIntent;
  speech?: string;
  channel?:CharacterId;
  origin?:ReplyOrigin;
  preserveReaction?:boolean;
}

export interface SceneReward {
  kind: CompanionEventKind | string;
  actors: CharacterId[];
  recall: string;
  trigger: string;
  result: string;
  bondBump?: { a: CharacterId; b: CharacterId; delta: number };
}

export interface SceneJob {
  cgAsset?:CgAssetId;
  id: string;
  cast: CharacterId[];
  source: string;
  priority: ScenePriority;
  cancelled: boolean;
  steps: SceneStep[];
  startedAt: number;
  /** True after the last step wave was handed to the engine for dispatch. */
  awaitingOwned?: boolean;
  /** Max end time of actions/moves this job actually dispatched (not foreign touches). */
  ownedUntil?: number;
  /** Wall time when success may commit; derived from ownedUntil after sealSettle. */
  settleUntil?: number;
  reward?: SceneReward;
  /** True once success was committed for this instance (idempotent). */
  committed?: boolean;
}

export type ScheduleOutcome = 'accepted' | 'rejected' | 'replaced';

const priorityRank: Record<ScenePriority, number> = { user: 3, reaction: 2, idle: 1 };

/**
 * Fallback grace only when a dispatched step reports no until/arrivesAt.
 * Not used to outrun a longer owned action.
 */
export const DEFAULT_SETTLE_MS = 4500;

export class SceneDirector {
  current: SceneJob | null = null;
  private cooldowns = new Map<string, number>();
  private readonly cooldownMs: number;
  private readonly settleMs: number;
  /** Job ids whose rewards were already applied. */
  private committedIds = new Set<string>();

  constructor(cooldownMs = 5 * 60_000, settleMs = DEFAULT_SETTLE_MS) {
    this.cooldownMs = cooldownMs;
    this.settleMs = settleMs;
  }

  clear(): SceneJob | null {
    const was = this.current;
    if (was) was.cancelled = true;
    this.current = null;
    return was;
  }

  /** Cancel without success when a necessary cast step cannot run. */
  failEssential(): void {
    if (!this.current || this.current.cancelled) return;
    this.current.cancelled = true;
    this.current = null;
  }

  /** Cancel current job if any cast member is missing from present. */
  dropMissing(present: CharacterId[]): boolean {
    if (!this.current || this.current.cancelled) return false;
    if (this.current.cast.some(id => !present.includes(id))) {
      this.clear();
      return true;
    }
    return false;
  }

  canSchedule(source: string, now = Date.now()): boolean {
    const last = this.cooldowns.get(source) ?? 0;
    return now - last >= this.cooldownMs;
  }

  /**
   * Replace or reject based on priority. Same actor cannot star in two jobs
   * unless the new job outranks (or equal+user).
   */
  schedule(
    job: Omit<SceneJob, 'cancelled' | 'startedAt' | 'committed' | 'settleUntil' | 'awaitingOwned' | 'ownedUntil'> & { startedAt?: number },
    now = Date.now(),
  ): { outcome: ScheduleOutcome; job: SceneJob | null } {
    if (!job.steps.length) return { outcome: 'rejected', job: this.current };
    if (this.current && !this.current.cancelled) {
      const cur = priorityRank[this.current.priority];
      const next = priorityRank[job.priority];
      if (next < cur) return { outcome: 'rejected', job: this.current };
      const overlap = job.cast.some(id => this.current!.cast.includes(id));
      if (overlap && next === cur && job.priority !== 'user') {
        return { outcome: 'rejected', job: this.current };
      }
      this.current.cancelled = true;
    }
    this.current = {
      ...job,
      cancelled: false,
      startedAt: job.startedAt ?? now,
      committed: false,
      awaitingOwned: false,
      ownedUntil: undefined,
      settleUntil: undefined,
    };
    this.cooldowns.set(job.source, now);
    return { outcome: 'accepted', job: this.current };
  }

  /**
   * Pop due steps. After the final wave is returned, the engine must call
   * noteOwnedEnd for each successful dispatch, then sealSettle(now).
   */
  due(now = Date.now()): { steps: SceneStep[]; completed: SceneJob | null } {
    if (!this.current || this.current.cancelled) {
      this.current = null;
      return { steps: [], completed: null };
    }
    const job = this.current;
    if (job.settleUntil != null) {
      if (now >= job.settleUntil) {
        const done = job;
        this.current = null;
        return { steps: [], completed: done };
      }
      return { steps: [], completed: null };
    }
    if (job.awaitingOwned) {
      return { steps: [], completed: null };
    }
    const ready = job.steps.filter(s => s.at <= now);
    job.steps = job.steps.filter(s => s.at > now);
    if (!job.steps.length && ready.length) {
      job.awaitingOwned = true;
    }
    return { steps: ready, completed: null };
  }

  /** Record end time of an action this job just dispatched for a cast member. */
  noteOwnedEnd(until: number): void {
    if (!this.current || this.current.cancelled || !Number.isFinite(until) || until <= 0) return;
    this.current.ownedUntil = Math.max(this.current.ownedUntil ?? 0, until);
  }

  /**
   * After the engine finishes the due wave: bind settle to owned action ends.
   * No successful owned end → cancel (no reward). Does not use a fixed window
   * that outruns a longer body.until / arrivesAt.
   */
  sealSettle(now = Date.now()): void {
    const job = this.current;
    if (!job || job.cancelled || !job.awaitingOwned || job.settleUntil != null) return;
    if (job.ownedUntil == null) {
      job.cancelled = true;
      this.current = null;
      return;
    }
    // Floor: never settle before "now" if clocks skew; never earlier than owned end.
    job.settleUntil = Math.max(job.ownedUntil, now);
    job.awaitingOwned = false;
  }

  /** Mark reward committed; returns false if already done or cancelled. */
  tryCommit(job: SceneJob): boolean {
    if (job.cancelled || job.committed || this.committedIds.has(job.id)) return false;
    job.committed = true;
    this.committedIds.add(job.id);
    return true;
  }

  pending(): SceneStep[] {
    return this.current && !this.current.cancelled ? [...this.current.steps] : [];
  }
  delayPending(ms:number){if(this.current&&!this.current.cancelled&&ms>0)for(const step of this.current.steps)step.at+=ms;}

  hasActiveJob(): boolean {
    return !!this.current && !this.current.cancelled;
  }

  activePriority(): ScenePriority | null {
    return this.current && !this.current.cancelled ? this.current.priority : null;
  }

  activeJobId(): string | null {
    return this.current && !this.current.cancelled ? this.current.id : null;
  }
}
