import { DEEP_SPACE, EXTENDED_ROUTE, PLANETS } from './planets';

describe.each([
  ['PLANETS', PLANETS],
  ['EXTENDED_ROUTE', EXTENDED_ROUTE],
])('%s', (_name, PLANETS) => {
  it('starts at zero points', () => {
    expect(PLANETS[0].minPoints).toBe(0);
  });

  it('is ordered by the points needed', () => {
    const points = PLANETS.map((planet) => planet.minPoints);

    expect(points).toEqual([...points].sort((a, b) => a - b));
    expect(new Set(points).size).toBe(points.length);
  });

  it('gets farther from Earth at every stop', () => {
    const distances = PLANETS.map((planet) => planet.distanceKm);

    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('has a name and a fact for every planet', () => {
    for (const planet of PLANETS) {
      expect(planet.name.trim(), planet.id).not.toBe('');
      expect(planet.fact.trim(), planet.id).not.toBe('');
      expect(planet.toName.toLowerCase(), planet.id).toContain(planet.name.toLowerCase());
    }
  });
});

describe('EXTENDED_ROUTE', () => {
  it('goes on from Pluto to the nearest star', () => {
    expect(EXTENDED_ROUTE.slice(0, PLANETS.length)).toEqual(PLANETS);
    expect(EXTENDED_ROUTE.slice(PLANETS.length)).toEqual(DEEP_SPACE);
    expect(EXTENDED_ROUTE.at(-1)?.id).toBe('proxima');
    expect(new Set(EXTENDED_ROUTE.map((stop) => stop.id)).size).toBe(13);
  });
});
