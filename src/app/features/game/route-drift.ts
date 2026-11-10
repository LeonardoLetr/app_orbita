/** How fast the rocket creeps ahead on its own, in stops of the route per second. */
export const DRIFT_PER_SECOND = 0.01;
/** The farthest the rocket gets ahead of its score, in stops, when nothing is scored for long. */
export const MAX_LEAD = 0.5;

/**
 * The slow, constant climb of the rocket between answers. It is only for the eyes: the
 * rocket is drawn a little ahead of where its score puts it (the lead), so the planets
 * keep sliding past instead of standing still. Each boost takes back part of the lead
 * while it flies, which keeps the drawing close to the score however long the round is.
 */
export class RouteDrift {
  private ahead = 0;
  private toShed = 0;
  private shedPerSecond = 0;

  /** How far ahead of the score the rocket is drawn, in stops. */
  get lead(): number {
    return this.ahead;
  }

  /** Lets time go by: the rocket creeps ahead, and gives back what a boost is taking. */
  advance(seconds: number): void {
    const shed = Math.min(this.toShed, this.shedPerSecond * seconds);
    this.toShed -= shed;
    this.ahead = Math.min(MAX_LEAD, Math.max(0, this.ahead + DRIFT_PER_SECOND * seconds - shed));
  }

  /**
   * A flight of `stops` lasting `seconds` begins. Half of the lead is given back along
   * it, but never more than half of the flight, so the rocket only ever moves forward.
   */
  boost(stops: number, seconds: number): void {
    this.toShed = Math.max(0, Math.min(this.ahead / 2, stops / 2));
    this.shedPerSecond = seconds > 0 ? this.toShed / seconds : 0;
    if (seconds <= 0) {
      this.toShed = 0;
    }
  }

  /** Back on the ground, for a new round. */
  reset(): void {
    this.ahead = 0;
    this.toShed = 0;
  }
}
