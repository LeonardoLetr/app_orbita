import { PLANETS } from '../data/planets';
import { Route } from '../models/planet';

/**
 * Where the rocket is on the route, measured in stops: 0 is Earth orbit, 1 the Moon,
 * 1.5 halfway to Mars, and so on. Slightly past the last stop at most.
 */
export function routePosition(points: number, route: Route = PLANETS): number {
  const last = route.length - 1;
  for (let i = 0; i < last; i++) {
    const from = route[i].minPoints;
    const to = route[i + 1].minPoints;
    if (points < to) {
      return i + Math.max(0, points - from) / (to - from);
    }
  }
  const lastGap = route[last].minPoints - route[last - 1].minPoints;
  return Math.min(last + (points - route[last].minPoints) / lastGap, last + 0.5);
}

/** Index of the farthest stop reached with the given points. */
export function reachedIndex(points: number, route: Route = PLANETS): number {
  return route.filter((planet) => points >= planet.minPoints).length - 1;
}

/** Distance from Earth reached with the given points, growing geometrically between stops. */
export function distanceAt(points: number, route: Route = PLANETS): number {
  const position = routePosition(points, route);
  const last = route.length - 1;
  const index = Math.min(Math.floor(position), last - 1);
  const from = route[index].distanceKm;
  const to = route[index + 1].distanceKm;
  return from * (to / from) ** (position - index);
}

const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** Short Portuguese distance, such as "384 mil km" or "1,4 bilhão de km". */
export function formatDistance(km: number): string {
  const scaled = (value: number) => NUMBER.format(value >= 10 ? Math.round(value) : value);
  if (km >= 1e12) {
    const value = Math.round((km / 1e12) * 10) / 10;
    return `${scaled(value)} ${value < 2 ? 'trilhão' : 'trilhões'} de km`;
  }
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
