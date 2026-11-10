import { RoundRules } from '../models/round-rules';
import { pickRandom } from '../utils/pick-random';

/** Length of a blitz round. */
export const BLITZ_SECONDS = 60;

/**
 * Against the clock: one minute for the whole round and as many categories as fit in
 * it, at a quick pace. The round ends when the clock runs out.
 */
export const BLITZ_RULES: RoundRules = {
  clock: { scope: 'round', seconds: BLITZ_SECONDS },
  pace: 'quick',

  /** Every category in random order, the ones from the previous round last. */
  pickCategories(all, previous, random) {
    const shuffled = pickRandom(all, all.length, random);
    return [
      ...shuffled.filter((category) => !previous.has(category.id)),
      ...shuffled.filter((category) => previous.has(category.id)),
    ];
  },
};
