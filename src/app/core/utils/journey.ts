import { PLANETS } from '../data/planets';

/**
 * Where the rocket is on the route, measured in stops: 0 is Earth orbit, 1 the Moon,
 * 1.5 halfway to Mars, and so on. Slightly past the last stop at most.
 */
export function routePosition(points: number): number {
  const last = PLANETS.length - 1;
  for (let i = 0; i < last; i++) {
    const from = PLANETS[i].minPoints;
    const to = PLANETS[i + 1].minPoints;
    if (points < to) {
      return i + Math.max(0, points - from) / (to - from);
    }
  }
  const lastGap = PLANETS[last].minPoints - PLANETS[last - 1].minPoints;
  return Math.min(last + (points - PLANETS[last].minPoints) / lastGap, last + 0.5);
}

/** Index of the farthest stop reached with the given points. */
export function reachedIndex(points: number): number {
  return PLANETS.filter((planet) => points >= planet.minPoints).length - 1;
}
