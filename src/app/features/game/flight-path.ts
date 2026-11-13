import { Easing, ease } from './flight-motion';

/** Where the rocket is at each moment of a flight over the map, in points. */
export interface FlightPath {
  /** The whole flight, in milliseconds. */
  duration: number;
  /** Position on the map after this many milliseconds. */
  at(ms: number): number;
  /** When the rocket is right beside a place it passes, in milliseconds. */
  passes(place: number): number;
}

/** An eased flight from one score to another, lasting `duration` milliseconds. */
export function flightPath(from: number, to: number, duration: number, easing: Easing): FlightPath {
  const span = to - from;
  const at = (ms: number) => from + span * ease(easing, duration > 0 ? ms / duration : 1);
  return {
    duration,
    at,
    passes(place) {
      // The position only grows along the flight: close in on the moment by halving.
      let low = 0;
      let high = duration;
      for (let i = 0; i < 24; i++) {
        const middle = (low + high) / 2;
        if (at(middle) < place) low = middle;
        else high = middle;
      }
      return high;
    },
  };
}
