import type { AppState, CharacterId, CastPreset } from './types';
import { characters, providers } from './characters';

const ids = characters.map(c => c.id) as CharacterId[];

/** Character id → the vendor id that matches her display name (for honesty badges). */
export const characterHomeProvider: Record<CharacterId, string> = {
  xia: 'deepseek',
  rin: 'claude',
  shiori: 'openai',
  gemini: 'gemini',
  glm: 'glm',
  kimi: 'kimi',
  grok: 'grok',
};

/** Default “core three” for a smaller cast day. */
export const CORE_CAST: CharacterId[] = ['xia', 'rin', 'shiori'];

export type { CastPreset };

export function providerLabel(providerId: string) {
  return providers.find(p => p.id === providerId)?.name ?? providerId;
}

/** Preferred backend for a character: override → house brain. */
export function preferredProvider(state: AppState, id: CharacterId): string {
  const override = state.characterProviders?.[id];
  if (override && providers.some(p => p.id === override)) return override;
  return state.settings.provider;
}

/** True when the speaking backend is not her “home” vendor name. */
export function isImpersonating(characterId: CharacterId, providerId: string) {
  return characterHomeProvider[characterId] !== providerId;
}

export function allCharacterIds(): CharacterId[] {
  return [...ids];
}

/** Who should be on stage for a preset (render / living). */
export function presentForPreset(preset: CastPreset, customPresent?: CharacterId[]): CharacterId[] {
  if (preset === 'all') return [...ids];
  if (preset === 'core') return [...CORE_CAST];
  const custom = (customPresent ?? ids).filter(id => ids.includes(id));
  return [...new Set(custom)];
}

/**
 * @deprecated Legacy helper from muted-as-cast era. Prefer presentForPreset.
 * Kept so older tests/docs that mention muted-for-core still compile during migration.
 */
export function mutedForPreset(preset: CastPreset, customMuted: CharacterId[] = []): CharacterId[] {
  if (preset === 'all') return [];
  if (preset === 'core') return ids.filter(id => !CORE_CAST.includes(id));
  return customMuted.filter(id => ids.includes(id));
}

/** Infer preset from who is present (not from mute). */
export function inferCastPreset(presentIds: CharacterId[]): CastPreset {
  const present = normalizePresentIds(presentIds);
  if (present.length === ids.length && ids.every(id => present.includes(id))) return 'all';
  if (
    present.length === CORE_CAST.length &&
    CORE_CAST.every(id => present.includes(id))
  ) {
    return 'core';
  }
  return 'custom';
}

export function normalizePresentIds(presentIds: CharacterId[] | undefined | null): CharacterId[] {
  if (!Array.isArray(presentIds) || !presentIds.length) return [];
  return [...new Set(presentIds.filter(id => ids.includes(id)))];
}

export function isPresent(state: AppState, id: CharacterId): boolean {
  return (state.presentIds ?? ids).includes(id);
}

export function isSpeaking(state: AppState, id: CharacterId): boolean {
  return isPresent(state, id) && !state.muted.includes(id);
}

/** Visible on room / Dock / free pets. */
export function presentCast(state: AppState): CharacterId[] {
  return normalizePresentIds(state.presentIds ?? ids);
}

/** May speak, auto-react, join scenes as a talker. */
export function speakingCast(state: AppState): CharacterId[] {
  return presentCast(state).filter(id => !state.muted.includes(id));
}

/** @deprecated Use speakingCast — name kept for call-site sweeps. */
export function activeCast(state: AppState): CharacterId[] {
  return speakingCast(state);
}

/**
 * Migrate saved state: presentIds is the cast; muted is quiet-among-present only.
 * - Missing presentIds + core → CORE_CAST; muted ∩ present
 * - Missing presentIds + all/custom → everyone present; keep muted (quiet ≠ absent)
 */
export function migratePresentIds(
  saved: {
    presentIds?: CharacterId[];
    muted?: CharacterId[];
    castPreset?: CastPreset;
  },
): { presentIds: CharacterId[]; muted: CharacterId[]; castPreset: CastPreset } {
  const oldMuted = Array.isArray(saved.muted) ? saved.muted.filter(id => ids.includes(id)) : [];
  const preset =
    saved.castPreset === 'all' || saved.castPreset === 'core' || saved.castPreset === 'custom'
      ? saved.castPreset
      : undefined;

  if (Array.isArray(saved.presentIds)) {
    const presentIds = normalizePresentIds(saved.presentIds);
    const muted = oldMuted.filter(id => presentIds.includes(id));
    return {
      presentIds,
      muted,
      castPreset: preset ?? inferCastPreset(presentIds),
    };
  }

  if (preset === 'core') {
    const presentIds = [...CORE_CAST];
    return {
      presentIds,
      muted: oldMuted.filter(id => presentIds.includes(id)),
      castPreset: 'core',
    };
  }

  // all / custom / missing: everyone present; keep quiet flags
  const presentIds = [...ids];
  return {
    presentIds,
    muted: oldMuted,
    castPreset: preset ?? inferCastPreset(presentIds),
  };
}

export function castSummary() {
  return characters.map(c => ({ id: c.id, name: c.name, home: characterHomeProvider[c.id] }));
}
