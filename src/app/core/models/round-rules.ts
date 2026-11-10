import { Category } from './category';

/**
 * What changes from one game mode to another. The game engine asks these rules
 * instead of having them built in.
 */
export interface RoundRules {
  /** Seconds to answer each category. */
  readonly secondsPerCategory: number;
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
