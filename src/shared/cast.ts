import type { AppState, CharacterId } from './types';
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

export type CastPreset = 'all' | 'core' | 'custom';

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

export function mutedForPreset(preset: CastPreset, customMuted: CharacterId[] = []): CharacterId[] {
  if (preset === 'all') return [];
  if (preset === 'core') return ids.filter(id => !CORE_CAST.includes(id));
  return customMuted.filter(id => ids.includes(id));
}

export function inferCastPreset(muted: CharacterId[]): CastPreset {
  if (!muted.length) return 'all';
  const coreMuted = mutedForPreset('core');
  const same =
    muted.length === coreMuted.length && coreMuted.every(id => muted.includes(id));
  return same ? 'core' : 'custom';
}

export function activeCast(state: AppState): CharacterId[] {
  return ids.filter(id => !state.muted.includes(id));
}

export function castSummary() {
  return characters.map(c => ({ id: c.id, name: c.name, home: characterHomeProvider[c.id] }));
}
