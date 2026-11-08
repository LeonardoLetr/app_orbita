/**
 * Picks up to `count` distinct items in random order, using a partial
 * Fisher–Yates shuffle. The source array is left untouched.
 */
export function pickRandom<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const pool = [...items];
  const size = Math.min(count, pool.length);

  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, size);
}
