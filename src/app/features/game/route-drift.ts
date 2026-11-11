import { FLY_EASING, FLY_END_SLOPE, ease } from './flight-motion';

/** How fast the rocket cruises on its own, in stops of the route per second. */
export const CRUISE_PER_SECOND = 0.02;
/** The farthest the rocket gets ahead of its score, in stops, when nothing is scored for long. */
export const MAX_LEAD = 0.6;
/** How long the momentum of a boost takes to fade into the cruise (its time constant). */
export const MOMENTUM_SECONDS = 2.2;

/**
 * The motion of the rocket that does not come from the flights themselves. It is only for
 * the eyes: the rocket is drawn a little ahead of, or behind, where its score puts it (the
 * lead), so the planets keep sliding past and nothing ever stops dead.
 *
 * - It cruises: a slow, constant climb, easing off as the lead nears its limit.
 * - A boost does not end in a stop: the last part of its distance is held back during the
 *   flight and handed over afterwards as momentum, starting at the speed the flight ended
 *   with and fading into the cruise.
 * - A boost also takes back half of the lead, so the drawing stays close to the score.
 */
export class RouteDrift {
  private ahead = 0;
  /** Distance still to hand over as momentum, in stops. */
  private momentum = 0;
  private flight?: { total: number; seconds: number; elapsed: number; held: number; tail: number };

  /** How far ahead of the score the rocket is drawn, in stops (negative: behind). */
  get lead(): number {
    return this.ahead;
  }

  /** Speed of the rocket apart from the flight, in stops per second. */
  get speed(): number {
    return this.cruise() + this.momentum / MOMENTUM_SECONDS;
  }

  /** Lets time go by. */
  advance(seconds: number): void {
    if (this.flight) {
      // Hold back along the flight, with its own easing, so the route never moves backwards.
      const flight = this.flight;
      flight.elapsed += seconds;
      const held = flight.total * ease(FLY_EASING, Math.min(1, flight.elapsed / flight.seconds));
      this.ahead -= held - flight.held;
      flight.held = held;
      if (flight.elapsed >= flight.seconds) {
        this.momentum += flight.tail;
        this.flight = undefined;
      }
    }
    const handed = this.momentum * (1 - Math.exp(-seconds / MOMENTUM_SECONDS));
    this.momentum -= handed;
    this.ahead = Math.min(MAX_LEAD, this.ahead + handed + this.cruise() * seconds);
  }

  /**
   * A flight of `stops` lasting `seconds` begins. Returns the part of it, in stops, that
   * is kept for the momentum after the flight.
   */
  boost(stops: number, seconds: number): number {
    if (stops <= 0 || seconds <= 0) {
      return 0;
    }
    this.finishFlight();
    const back = Math.min(Math.max(0, this.ahead) / 2, stops / 2);
    // The momentum starts at the speed the flight ends with: tail = end speed x its time.
    const ratio = (FLY_END_SLOPE * MOMENTUM_SECONDS) / seconds;
    const tail = ((stops - back) * ratio) / (1 + ratio);
    this.flight = { total: back + tail, seconds, elapsed: 0, held: 0, tail };
    return tail;
  }

  /** A push with no flight behind it, such as the end of the launch. */
  kick(stops: number): void {
    this.momentum += stops;
  }

  /** Back on the ground, for a new round. */
  reset(): void {
    this.ahead = 0;
    this.momentum = 0;
    this.flight = undefined;
  }

  /** The cruise eases off near the limit, so even a long wait never ends in a sudden stop. */
  private cruise(): number {
    const near = Math.max(0, this.ahead) / MAX_LEAD;
    return CRUISE_PER_SECOND * Math.max(0, 1 - near * near);
  }

  /** A new boost cut a flight short: what it had not held back yet no longer matters. */
  private finishFlight(): void {
    if (this.flight) {
      this.momentum += this.flight.tail * (this.flight.held / this.flight.total || 0);
      this.flight = undefined;
    }
  }
}
