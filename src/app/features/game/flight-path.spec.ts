import { FLY_EASING } from './flight-motion';
import { flightPath } from './flight-path';

describe('flightPath', () => {
  it('goes from one score to the other over the flight', () => {
    const path = flightPath(20, 150, 2000, FLY_EASING);

    expect(path.at(0)).toBe(20);
    expect(path.at(2000)).toBe(150);
    expect(path.at(5000)).toBe(150);
  });

  it('never goes back', () => {
    const path = flightPath(20, 150, 2000, FLY_EASING);
    let last = 20;
    for (let ms = 0; ms <= path.duration; ms += 20) {
      expect(path.at(ms)).toBeGreaterThanOrEqual(last);
      last = path.at(ms);
    }
  });

  it('tells when it is beside a place on the way', () => {
    const path = flightPath(0, 200, 2000, FLY_EASING);
    const moment = path.passes(100);

    expect(moment).toBeGreaterThan(0);
    expect(moment).toBeLessThan(2000);
    expect(path.at(moment)).toBeCloseTo(100, 0);
  });

  it('is beside the place it ends on at the end', () => {
    expect(flightPath(0, 40, 1000, FLY_EASING).passes(40)).toBeCloseTo(1000, 0);
  });
});
