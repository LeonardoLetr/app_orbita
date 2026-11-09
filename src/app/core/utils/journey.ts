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

/** Distance from Earth reached with the given points, growing geometrically between stops. */
export function distanceAt(points: number): number {
  const position = routePosition(points);
  const last = PLANETS.length - 1;
  const index = Math.min(Math.floor(position), last - 1);
  const from = PLANETS[index].distanceKm;
  const to = PLANETS[index + 1].distanceKm;
  return from * (to / from) ** (position - index);
}

const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** Short Portuguese distance, such as "384 mil km" or "1,4 bilhão de km". */
export function formatDistance(km: number): string {
  const scaled = (value: number) => NUMBER.format(value >= 10 ? Math.round(value) : value);
  if (km >= 1e9) {
    const value = Math.round((km / 1e9) * 10) / 10;
    return `${scaled(value)} ${value < 2 ? 'bilhão' : 'bilhões'} de km`;
  }
  if (km >= 1e6) {
    const value = Math.round((km / 1e6) * 10) / 10;
    return `${scaled(value)} ${value < 2 ? 'milhão' : 'milhões'} de km`;
  }
  if (km >= 1e3) {
    return `${NUMBER.format(Math.round(km / 1e3))} mil km`;
  }
  return `${NUMBER.format(Math.round(km))} km`;
}
