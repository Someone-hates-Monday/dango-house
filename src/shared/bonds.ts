import type { CharacterId } from './types';
import { characters } from './characters';
import { socialProfiles, relationshipKey } from './social';

const ids = characters.map(c => c.id) as CharacterId[];

export type BondTier = 'acquaint' | 'daily' | 'intimate' | 'exclusive';

export const BOND_DAILY = 40;
export const BOND_INTIMATE = 60;
export const BOND_EXCLUSIVE = 80;

export function bondTier(value: number): BondTier {
  if (value >= BOND_EXCLUSIVE) return 'exclusive';
  if (value >= BOND_INTIMATE) return 'intimate';
  if (value >= BOND_DAILY) return 'daily';
  return 'acquaint';
}

export function bumpBond(bonds: Record<string, number>, from: CharacterId, to: CharacterId, delta: number) {
  const key = relationshipKey(from, to);
  bonds[key] = Math.max(0, Math.min(100, (bonds[key] ?? 0) + delta));
  return bonds[key];
}

export function cpPartner(id: CharacterId): CharacterId {
  return socialProfiles[id].target;
}

/** Highest mutual-ish bond pair among active residents (directed max of A>B). */
export function stickiestPair(bonds: Record<string, number>, muted: CharacterId[] = []): { a: CharacterId; b: CharacterId; value: number } | null {
  let best: { a: CharacterId; b: CharacterId; value: number } | null = null;
  for (const a of ids) {
    if (muted.includes(a)) continue;
    const b = socialProfiles[a].target;
    if (muted.includes(b)) continue;
    const value = bonds[relationshipKey(a, b)] ?? 0;
    if (!best || value > best.value) best = { a, b, value };
  }
  return best;
}

export function bondOf(bonds: Record<string, number>, from: CharacterId, to: CharacterId) {
  return bonds[relationshipKey(from, to)] ?? 0;
}
