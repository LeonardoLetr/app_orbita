import { createMemoryStore, readJson, writeJson } from './storage';

describe('storage helpers', () => {
  it('writes and reads json values', () => {
    const store = createMemoryStore();

    writeJson(store, 'key', { a: 1 });

    expect(readJson(store, 'key')).toEqual({ a: 1 });
  });

  it('returns undefined for missing or broken values', () => {
    const store = createMemoryStore();
    store.setItem('broken', '{not json');

    expect(readJson(store, 'missing')).toBeUndefined();
    expect(readJson(store, 'broken')).toBeUndefined();
  });

  it('ignores write failures', () => {
    const store = {
      ...createMemoryStore(),
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    expect(() => writeJson(store, 'key', 1)).not.toThrow();
  });
});
