/** A step of the player's career, reached with the experience of every round played. */
export interface Rank {
  readonly id: string;
  /** Name shown to the player. */
  readonly name: string;
  /** Experience needed to reach it. */
  readonly minXp: number;
}
