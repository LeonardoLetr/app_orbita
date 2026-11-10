import { Category } from '../models/category';
import { pickRandom } from '../utils/pick-random';

/** Every category in random order, the ones just played last. */
export function shuffledCategories(
  all: readonly Category[],
  previous: ReadonlySet<string>,
  random: () => number,
): Category[] {
  const shuffled = pickRandom(all, all.length, random);
  return [
    ...shuffled.filter((category) => !previous.has(category.id)),
    ...shuffled.filter((category) => previous.has(category.id)),
  ];
}
