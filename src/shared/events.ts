import type { CharacterId } from './types';

export type CompanionEventKind =
  | 'chose-companion'
  | 'rival-react'
  | 'private-return'
  | 'seat-share'
  | 'star-fox-care'
  | 'pair-scene'
  | 'other';

/** Bounded local shared-life memory. Never store API keys or private chat bodies. */
export interface CompanionEvent {
  id: string;
  at: number;
  kind: CompanionEventKind;
  actors: CharacterId[];
  trigger: string;
  result: string;
  recall: string;
}

export const MAX_COMPANION_EVENTS = 200;

export function pushCompanionEvent(
  list: CompanionEvent[],
  event: Omit<CompanionEvent, 'id'> & { id?: string },
): CompanionEvent[] {
  const next: CompanionEvent = {
    id: event.id ?? `ev-${event.at}-${Math.random().toString(36).slice(2, 8)}`,
    at: event.at,
    kind: event.kind,
    actors: [...event.actors],
    trigger: event.trigger.slice(0, 120),
    result: event.result.slice(0, 160),
    recall: event.recall.slice(0, 160),
  };
  return [...list, next].slice(-MAX_COMPANION_EVENTS);
}

export function clearCompanionEvents(): CompanionEvent[] {
  return [];
}

export function recentEventsFor(
  list: CompanionEvent[],
  actors: CharacterId[],
  withinMs = 7 * 24 * 60 * 60_000,
  now = Date.now(),
): CompanionEvent[] {
  return list.filter(
    e => now - e.at <= withinMs && actors.some(id => e.actors.includes(id)),
  );
}

export function hasRecentKind(
  list: CompanionEvent[],
  kind: CompanionEventKind,
  withinMs: number,
  now = Date.now(),
): boolean {
  return list.some(e => e.kind === kind && now - e.at <= withinMs);
}

export function restoreCompanionEvents(value: unknown): CompanionEvent[] {
  if (!Array.isArray(value)) return [];
  const kinds: CompanionEventKind[] = [
    'chose-companion', 'rival-react', 'private-return', 'seat-share', 'star-fox-care', 'pair-scene', 'other',
  ];
  return value
    .filter((e): e is CompanionEvent =>
      !!e &&
      typeof e === 'object' &&
      typeof (e as CompanionEvent).id === 'string' &&
      typeof (e as CompanionEvent).at === 'number' &&
      kinds.includes((e as CompanionEvent).kind) &&
      Array.isArray((e as CompanionEvent).actors) &&
      typeof (e as CompanionEvent).recall === 'string')
    .map(e => ({
      id: String(e.id).slice(0, 64),
      at: e.at,
      kind: e.kind,
      actors: e.actors.filter((id): id is CharacterId => typeof id === 'string').slice(0, 7),
      trigger: String(e.trigger ?? '').slice(0, 120),
      result: String(e.result ?? '').slice(0, 160),
      recall: String(e.recall).slice(0, 160),
    }))
    .slice(-MAX_COMPANION_EVENTS);
}
