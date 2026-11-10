import { RoundRules } from '../models/round-rules';
import { shuffledCategories } from './shuffled-categories';

/** Length of a blitz round. */
export const BLITZ_SECONDS = 60;

/**
 * Against the clock: one minute for the whole round and as many categories as fit in
 * it, at a quick pace. The round ends when the clock runs out.
 */
export const BLITZ_RULES: RoundRules = {
  clock: { scope: 'round', seconds: BLITZ_SECONDS },
  pace: 'quick',
  canSkip: false,

  pickCategories: shuffledCategories,
};
