import type { AppState, CharacterId, PairTone } from './types';
import { characters } from './characters';
import { bumpBond, cpPartner } from './bonds';
import { favorRivalLines } from './social-yuri';

const ids = characters.map(c => c.id) as CharacterId[];

export function applyFavor(state: AppState, id: CharacterId, bondBump = 2) {
  if (state.favor.focusId === id) state.favor.streak = Math.min(99, state.favor.streak + 1);
  else {
    state.favor.focusId = id;
    state.favor.streak = 1;
  }
  const partner = cpPartner(id);
  bumpBond(state.bonds, id, partner, bondBump);
  bumpBond(state.bonds, partner, id, Math.max(1, Math.floor(bondBump / 2)));
  return state.favor.streak;
}

export function shouldEscalateRivalry(state: AppState) {
  return !!state.favor.focusId && state.favor.streak > 0 && state.favor.streak % 3 === 0;
}

export function rivalryEscalationCast(state: AppState, favored: CharacterId): CharacterId[] {
  const partner = cpPartner(favored);
  const other = ids.find(id => id !== favored && id !== partner && !state.muted.includes(id)) ?? partner;
  return [...new Set([partner, other])].filter(id => !state.muted.includes(id) && id !== favored);
}

export function rivalryEscalationBubbles(tone: PairTone, favored: CharacterId, cast: CharacterId[]) {
  const lines = favorRivalLines(tone, favored, cast[1] ?? cast[0]);
  return lines.filter(l => cast.includes(l.actor));
}
