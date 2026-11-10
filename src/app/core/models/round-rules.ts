import { Category } from './category';
import { Route } from './planet';

/**
 * What the countdown covers: each category gets its own, or a single one runs for the
 * whole round and ends it.
 */
export interface RoundClock {
  readonly scope: 'category' | 'round';
  readonly seconds: number;
  /**
   * Seconds for the category at a position in the round (from 0), where the time changes
   * as the round goes on. Without it every category gets `seconds`.
   */
  secondsAt?(index: number): number;
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
  /**
   * Highest score a round can reach, used as the top of the charts. Rounds with no
   * fixed number of categories have none.
   */
  readonly maxPoints?: number;
  /**
   * Lives the player starts with. One is lost with each category that ends without a
   * valid answer, and the round goes on, drawing categories again as needed, until
   * none is left. Without it the round ends when its categories or its clock run out.
   */
  readonly lives?: number;
  /** Stops the rocket can reach. The classic route, up to Pluto, when not given. */
  readonly route?: Route;
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
