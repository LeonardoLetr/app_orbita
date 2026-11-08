import { pickRandom } from './pick-random';

describe('pickRandom', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('returns the requested number of distinct items', () => {
    const picked = pickRandom(items, 4);

    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
    for (const item of picked) {
      expect(items).toContain(item);
    }
  });

  it('returns every item when asking for more than available', () => {
    expect(pickRandom(items, 10).sort()).toEqual(items);
  });

  it('does not change the source array', () => {
    const copy = [...items];
    pickRandom(items, 3);

    expect(items).toEqual(copy);
  });

  it('uses the given random source', () => {
    expect(pickRandom(items, 3, () => 0)).toEqual(['a', 'b', 'c']);
    expect(pickRandom(items, 2, () => 0.999)).toEqual(['f', 'a']);
  });
});
