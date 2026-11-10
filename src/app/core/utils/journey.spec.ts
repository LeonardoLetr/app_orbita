import { EXTENDED_ROUTE, PLANETS } from '../data/planets';
import { distanceAt, formatDistance, reachedIndex, routePosition } from './journey';

describe('routePosition', () => {
  it('maps points to stops along the route', () => {
    expect(routePosition(0)).toBe(0);
    expect(routePosition(20)).toBe(0.5);
    expect(routePosition(40)).toBe(1);
    expect(routePosition(70)).toBe(1.5);
    expect(routePosition(600)).toBe(7);
  });

  it('goes only a little past the last stop', () => {
    expect(routePosition(660)).toBe(7.5);
    expect(routePosition(700)).toBe(7.5);
  });
});

describe('reachedIndex', () => {
  it('is the farthest stop with enough points', () => {
    expect(reachedIndex(0)).toBe(0);
    expect(reachedIndex(39)).toBe(0);
    expect(reachedIndex(40)).toBe(1);
    expect(reachedIndex(700)).toBe(7);
  });
});

describe('distanceAt', () => {
  it('matches each stop distance at its minimum points', () => {
    for (const planet of PLANETS.slice(0, -1)) {
      expect(distanceAt(planet.minPoints)).toBeCloseTo(planet.distanceKm, -1);
    }
  });

  it('grows between stops', () => {
    expect(distanceAt(20)).toBeGreaterThan(distanceAt(0));
    expect(distanceAt(20)).toBeLessThan(distanceAt(40));
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

describe('on the route that goes past Pluto', () => {
  it('keeps going where the classic route ends', () => {
    expect(routePosition(600, EXTENDED_ROUTE)).toBe(7);
    expect(routePosition(700, EXTENDED_ROUTE)).toBe(7.5);
    expect(routePosition(800, EXTENDED_ROUTE)).toBe(8);
    expect(routePosition(2200, EXTENDED_ROUTE)).toBe(12);
    expect(routePosition(9999, EXTENDED_ROUTE)).toBe(12.5);
  });

  it('reaches the stops beyond Pluto', () => {
    expect(reachedIndex(700)).toBe(7);
    expect(reachedIndex(1000, EXTENDED_ROUTE)).toBe(9);
    expect(reachedIndex(5000, EXTENDED_ROUTE)).toBe(12);
  });

  it('measures the distance to them', () => {
    expect(distanceAt(800, EXTENDED_ROUTE)).toBeCloseTo(10_100_000_000, -1);
    expect(distanceAt(900, EXTENDED_ROUTE)).toBeGreaterThan(distanceAt(800, EXTENDED_ROUTE));
    expect(distanceAt(2000, EXTENDED_ROUTE)).toBeLessThan(40_000_000_000_000);
  });

  it('writes distances in trillions of km', () => {
    expect(formatDistance(40_000_000_000_000)).toBe('40 trilhões de km');
    expect(formatDistance(1_300_000_000_000)).toBe('1,3 trilhão de km');
    expect(formatDistance(300_000_000_000)).toBe('300 bilhões de km');
  });
});
