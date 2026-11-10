import { RoundRules } from '../models/round-rules';
import { RARITY_POINTS } from '../services/scoring-service';
import { pickRandom } from '../utils/pick-random';

export const CLASSIC_CATEGORIES = 7;

/** The original game: seven categories, half a minute for each. */
export const CLASSIC_RULES: RoundRules = {
  clock: { scope: 'category', seconds: 30 },
  pace: 'calm',
  maxPoints: CLASSIC_CATEGORIES * RARITY_POINTS.supernova,

  /** Draws the categories, avoiding the ones from the previous round when possible. */
  pickCategories(all, previous, random) {
    const fresh = all.filter((category) => !previous.has(category.id));
    const pool = fresh.length >= CLASSIC_CATEGORIES ? fresh : all;
    return pickRandom(pool, CLASSIC_CATEGORIES, random);
  },
};
