import { Category } from './category';

/**
 * What the countdown covers: each category gets its own, or a single one runs for the
 * whole round and ends it.
 */
export interface RoundClock {
  readonly scope: 'category' | 'round';
  readonly seconds: number;
}

/**
 * How a round moves from one category to the next. A calm round shows the whole flight
 * after each answer; a quick one keeps flights and results short and leaves the phone
 * keyboard open.
 */
export type RoundPace = 'calm' | 'quick';

/**
 * What changes from one game mode to another. The game engine asks these rules
 * instead of having them built in.
 */
export interface RoundRules {
  readonly clock: RoundClock;
  readonly pace: RoundPace;
  /** Highest score a round can reach, used as the top of the charts. */
  readonly maxPoints: number;
  /**
   * Categories of a new round, in the order they are asked. `previous` has the ids of
   * the round just played, so they can be avoided.
   */
  pickCategories(
    all: readonly Category[],
    previous: ReadonlySet<string>,
    random: () => number,
  ): Category[];
}
