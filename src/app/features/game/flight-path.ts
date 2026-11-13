import { Easing, ease } from './flight-motion';

/** Samples of a flight, enough for a smooth curve of a few seconds. */
const STEPS = 240;
/**
 * How near a stop, in points of the map, the rocket slows down to let it be seen: about
 * a fifth of a screen on either side.
 */
const NEAR = 8;

/** Where the rocket is at each moment of a flight over the map, in points. */
export interface FlightPath {
  /** The whole flight, in milliseconds, slow passes included. */
  duration: number;
  /** Position on the map after this many milliseconds. */
  at(ms: number): number;
  /** When the rocket is right beside a stop it passes, in milliseconds. */
  passes(stop: number): number;
}

/**
 * A flight from one score to another that slows down beside each stop on the way, so a
 * planet is not gone before it is seen. Without stops to pass it is a plain eased flight.
 *
 * `baseMs` is the flight with no slow pass; each stop passed adds `passMs` to it, spent
 * near that stop.
 */
export function flightPath(
  from: number,
  to: number,
  stops: readonly number[],
  baseMs: number,
  passMs: number,
  easing: Easing,
): FlightPath {
  const passed = stops.filter((stop) => stop > from && stop <= to);
  const span = to - from;
  const position = (u: number) => from + span * ease(easing, u);

  // Time is stretched where the rocket is near a stop: each step of the plain flight
  // takes longer the closer it is to one.
  const bumps = Array.from({ length: STEPS }, (_, i) => {
    const x = position((i + 0.5) / STEPS);
    return passed.reduce((sum, stop) => sum + Math.exp(-(((x - stop) / NEAR) ** 2)), 0);
  });
  const bumpTotal = bumps.reduce((sum, bump) => sum + bump, 0);
  const extra = bumpTotal > 0 ? passed.length * passMs : 0;
  const step = baseMs / STEPS;
  // Cumulative time at the end of each step.
  const times: number[] = [];
  let elapsed = 0;
  for (const bump of bumps) {
    elapsed += step + (bumpTotal > 0 ? (extra * bump) / bumpTotal : 0);
    times.push(elapsed);
  }
  const duration = baseMs + extra;

  /** Share of the plain flight done after this many milliseconds of the real one. */
  const plainShare = (ms: number) => {
    if (ms <= 0) return 0;
    if (ms >= duration) return 1;
    let low = 0;
    let high = STEPS - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (times[middle] < ms) low = middle + 1;
      else high = middle;
    }
    const start = low ? times[low - 1] : 0;
    return (low + (ms - start) / (times[low] - start)) / STEPS;
  };

  return {
    duration,
    at: (ms) => position(plainShare(ms)),
    passes(stop) {
      const index = Array.from({ length: STEPS }, (_, i) => i).find(
        (i) => position((i + 1) / STEPS) >= stop,
      );
      return index === undefined ? duration : times[index];
    },
  };
}
