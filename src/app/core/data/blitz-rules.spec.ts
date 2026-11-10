import { Category } from '../models/category';
import { BLITZ_RULES, BLITZ_SECONDS } from './blitz-rules';

describe('BLITZ_RULES', () => {
  const categories: Category[] = Array.from({ length: 12 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [],
  }));
  const ids = (picked: Category[]) => picked.map((category) => category.id);

  /** A repeatable sequence of numbers from 0 to 1, enough to shuffle differently each call. */
  function sequence(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  it('has a single clock for the whole round, at a quick pace', () => {
    expect(BLITZ_RULES.clock).toEqual({ scope: 'round', seconds: BLITZ_SECONDS });
    expect(BLITZ_RULES.pace).toBe('quick');
  });

  it('has no highest score, since the number of categories is open', () => {
    expect(BLITZ_RULES.maxPoints).toBeUndefined();
  });

  it('asks every category once, without repeating any', () => {
    const picked = ids(BLITZ_RULES.pickCategories(categories, new Set(), sequence(7)));

    expect(picked).toHaveLength(categories.length);
    expect(new Set(picked).size).toBe(categories.length);
  });

  it('shuffles the categories', () => {
    const first = ids(BLITZ_RULES.pickCategories(categories, new Set(), sequence(7)));
    const second = ids(BLITZ_RULES.pickCategories(categories, new Set(), sequence(99)));

    expect(first).not.toEqual(ids(categories));
    expect(first).not.toEqual(second);
  });

  it('leaves the categories of the previous round for last', () => {
    const previous = new Set(['c1', 'c4', 'c9']);

    const picked = ids(BLITZ_RULES.pickCategories(categories, previous, sequence(7)));

    expect(picked).toHaveLength(categories.length);
    expect(new Set(picked.slice(-3))).toEqual(previous);
  });

  it('does not change the list it draws from', () => {
    const before = ids(categories);

    BLITZ_RULES.pickCategories(categories, new Set(), sequence(7));

    expect(ids(categories)).toEqual(before);
  });

  it('does not let a category be skipped', () => {
    expect(BLITZ_RULES.canSkip).toBe(false);
  });
});
