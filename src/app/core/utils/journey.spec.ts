import { PLANETS } from '../data/planets';
import { distanceAt, formatDistance, reachedIndex, routePosition } from './journey';

describe('routePosition', () => {
  it('maps points to stops along the route', () => {
    expect(routePosition(0)).toBe(0);
    expect(routePosition(10)).toBe(0.5);
    expect(routePosition(20)).toBe(1);
    expect(routePosition(110)).toBe(5.5);
    expect(routePosition(140)).toBe(7);
  });

  it('goes only a little past the last stop', () => {
    expect(routePosition(150)).toBe(7.5);
    expect(routePosition(500)).toBe(7.5);
  });
});

describe('reachedIndex', () => {
  it('is the farthest stop with enough points', () => {
    expect(reachedIndex(0)).toBe(0);
    expect(reachedIndex(19)).toBe(0);
    expect(reachedIndex(20)).toBe(1);
    expect(reachedIndex(150)).toBe(7);
  });
});

describe('distanceAt', () => {
  it('matches each stop distance at its minimum points', () => {
    for (const planet of PLANETS.slice(0, -1)) {
      expect(distanceAt(planet.minPoints)).toBeCloseTo(planet.distanceKm, -1);
    }
  });

  it('grows between stops', () => {
    expect(distanceAt(10)).toBeGreaterThan(distanceAt(0));
    expect(distanceAt(10)).toBeLessThan(distanceAt(20));
  });
});

describe('formatDistance', () => {
  it('uses short Portuguese units', () => {
    expect(formatDistance(400)).toBe('400 km');
    expect(formatDistance(384_400)).toBe('384 mil km');
    expect(formatDistance(1_200_000)).toBe('1,2 milhão de km');
    expect(formatDistance(225_000_000)).toBe('225 milhões de km');
    expect(formatDistance(1_430_000_000)).toBe('1,4 bilhão de km');
    expect(formatDistance(5_900_000_000)).toBe('5,9 bilhões de km');
  });
});
