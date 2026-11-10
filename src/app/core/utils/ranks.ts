import { RANKS } from '../data/ranks';
import { Rank } from '../models/rank';

/** Where a player stands in the career. */
export interface RankStanding {
  rank: Rank;
  /** Position of the rank in the career, from 0. */
  level: number;
  /** The rank after this one; none at the top. */
  next?: Rank;
  /** Experience still needed for the next rank; 0 at the top. */
  missing: number;
  /** How far along the way to the next rank, from 0 to 1; 1 at the top. */
  progress: number;
}

export function rankFor(xp: number, ranks: readonly Rank[] = RANKS): RankStanding {
  const level = Math.max(0, ranks.filter((rank) => xp >= rank.minXp).length - 1);
  const rank = ranks[level];
  const next = ranks[level + 1];
  if (!next) {
    return { rank, level, missing: 0, progress: 1 };
  }
  return {
    rank,
    level,
    next,
    missing: next.minXp - xp,
    progress: Math.max(0, xp - rank.minXp) / (next.minXp - rank.minXp),
  };
}
