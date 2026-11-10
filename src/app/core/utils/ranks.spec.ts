import { RANKS } from '../data/ranks';
import { rankFor } from './ranks';

describe('RANKS', () => {
  it('start at zero and ask for more experience at every step', () => {
    const steps = RANKS.map((rank) => rank.minXp);

    expect(steps[0]).toBe(0);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
    expect(new Set(RANKS.map((rank) => rank.id)).size).toBe(RANKS.length);
  });
});

describe('rankFor', () => {
  it('starts everyone as a cadet', () => {
    const standing = rankFor(0);

    expect(standing.rank.name).toBe('Cadete');
    expect(standing.level).toBe(0);
    expect(standing.next?.name).toBe('Piloto');
    expect(standing.missing).toBe(500);
    expect(standing.progress).toBe(0);
  });

  it('moves up exactly at the experience of each rank', () => {
    for (const [level, rank] of RANKS.entries()) {
      expect(rankFor(rank.minXp).rank, rank.id).toBe(rank);
      expect(rankFor(rank.minXp).level, rank.id).toBe(level);
      if (level > 0) {
        expect(rankFor(rank.minXp - 1).rank, rank.id).toBe(RANKS[level - 1]);
      }
    }
  });

  it('says how far along the way to the next rank the player is', () => {
    const standing = rankFor(1000);

    expect(standing.rank.name).toBe('Piloto');
    expect(standing.missing).toBe(500);
    expect(standing.progress).toBe(0.5);
  });

  it('has nothing left to reach at the top', () => {
    const standing = rankFor(999_999);

    expect(standing.rank).toBe(RANKS.at(-1));
    expect(standing.next).toBeUndefined();
    expect(standing.missing).toBe(0);
    expect(standing.progress).toBe(1);
  });

  it('treats odd values as no experience', () => {
    expect(rankFor(-50).rank).toBe(RANKS[0]);
    expect(rankFor(-50).progress).toBe(0);
  });
});
