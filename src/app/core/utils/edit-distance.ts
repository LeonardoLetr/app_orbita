/**
 * Number of single-letter edits (insert, delete, replace or swap two neighbors)
 * needed to turn one text into the other. Stops early: anything farther than
 * `limit` is reported as `limit + 1`.
 */
export function editDistance(a: string, b: string, limit = 1): number {
  if (Math.abs(a.length - b.length) > limit) {
    return limit + 1;
  }
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowBest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, beforePrevious[j - 2] + 1);
      }
      current.push(value);
      rowBest = Math.min(rowBest, value);
    }
    if (rowBest > limit) {
      return limit + 1;
    }
    beforePrevious = previous;
    previous = current;
  }
  return Math.min(previous[b.length], limit + 1);
}
