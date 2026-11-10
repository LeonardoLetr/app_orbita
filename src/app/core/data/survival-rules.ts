import { RoundRules } from '../models/round-rules';
import { EXTENDED_ROUTE } from './planets';
import { shuffledCategories } from './shuffled-categories';

export const SURVIVAL_LIVES = 3;

/** Seconds for each category, getting shorter every few categories. */
const PRESSURE = [30, 25, 20, 15];
/** Categories played before the time gets shorter. */
const PRESSURE_STEP = 7;

/**
 * As far as the lives last: a category that ends without a valid answer costs one of the
 * three lives, the time for each category shrinks as the round goes on, and the route
 * continues past Pluto.
 */
export const SURVIVAL_RULES: RoundRules = {
  clock: {
    scope: 'category',
    seconds: PRESSURE[0],
    secondsAt: (index) =>
      PRESSURE[Math.min(Math.floor(index / PRESSURE_STEP), PRESSURE.length - 1)],
  },
  pace: 'calm',
  lives: SURVIVAL_LIVES,
  route: EXTENDED_ROUTE,
  pickCategories: shuffledCategories,
};
