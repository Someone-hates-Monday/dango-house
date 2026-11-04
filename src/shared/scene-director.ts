import type { AvatarIntent, CharacterId } from './types';

export type ScenePriority = 'user' | 'reaction' | 'idle';

export interface SceneStep {
  at: number;
  actor: CharacterId;
  intent: AvatarIntent;
  speech?: string;
}

export interface SceneJob {
  id: string;
  cast: CharacterId[];
  source: string;
  priority: ScenePriority;
  cancelled: boolean;
  steps: SceneStep[];
  startedAt: number;
  /** Optional bond/event result when the last step fires. */
  onComplete?: { kind: string; actors: CharacterId[]; recall: string };
}

const priorityRank: Record<ScenePriority, number> = { user: 3, reaction: 2, idle: 1 };

export class SceneDirector {
  current: SceneJob | null = null;
  private cooldowns = new Map<string, number>();
  private readonly cooldownMs: number;

  constructor(cooldownMs = 5 * 60_000) {
    this.cooldownMs = cooldownMs;
  }

  clear() {
    if (this.current) this.current.cancelled = true;
    this.current = null;
  }

  /** Drop jobs that need an actor who left the stage. */
  dropMissing(present: CharacterId[]) {
    if (!this.current) return;
    if (this.current.cast.some(id => !present.includes(id))) this.clear();
    else {
      this.current.steps = this.current.steps.filter(
        s => present.includes(s.actor) && (!s.intent.target || present.includes(s.intent.target as CharacterId) || typeof s.intent.target !== 'string' || s.intent.target.length > 8),
      );
      if (!this.current.steps.length) this.clear();
    }
  }

  canSchedule(source: string, now = Date.now()): boolean {
    const last = this.cooldowns.get(source) ?? 0;
    return now - last >= this.cooldownMs;
  }

  /**
   * Replace or reject based on priority. Same actor cannot star in two jobs.
   * Returns the active job steps (possibly empty if rejected).
   */
  schedule(job: Omit<SceneJob, 'cancelled' | 'startedAt'> & { startedAt?: number }, now = Date.now()): SceneStep[] {
    if (!job.steps.length) return [];
    if (this.current && !this.current.cancelled) {
      const cur = priorityRank[this.current.priority];
      const next = priorityRank[job.priority];
      if (next < cur) return this.current.steps;
      const overlap = job.cast.some(id => this.current!.cast.includes(id));
      if (overlap && next === cur && job.priority !== 'user') return this.current.steps;
    }
    this.current = {
      ...job,
      cancelled: false,
      startedAt: job.startedAt ?? now,
    };
    this.cooldowns.set(job.source, now);
    return this.current.steps;
  }

  due(now = Date.now()): { steps: SceneStep[]; completed: SceneJob | null } {
    if (!this.current || this.current.cancelled) {
      this.current = null;
      return { steps: [], completed: null };
    }
    const ready = this.current.steps.filter(s => s.at <= now);
    this.current.steps = this.current.steps.filter(s => s.at > now);
    let completed: SceneJob | null = null;
    if (!this.current.steps.length && ready.length) {
      completed = this.current;
      this.current = null;
    }
    return { steps: ready, completed };
  }

  /** Compatibility: expose remaining steps like the old scene array. */
  pending(): SceneStep[] {
    return this.current && !this.current.cancelled ? [...this.current.steps] : [];
  }

  replaceRaw(steps: SceneStep[], meta: { id: string; source: string; priority: ScenePriority; cast: CharacterId[] }, now = Date.now()) {
    return this.schedule({ ...meta, steps }, now);
  }
}
