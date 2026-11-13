import { FLY_EASING } from './flight-motion';
import { flightPath } from './flight-path';

describe('flightPath', () => {
  it('is a plain flight when no stop is passed', () => {
    const path = flightPath(0, 30, [40, 100], 1000, 700, FLY_EASING);

    expect(path.duration).toBe(1000);
    expect(path.at(0)).toBe(0);
    expect(path.at(1000)).toBe(30);
    expect(path.at(500)).toBeGreaterThan(5);
    expect(path.at(500)).toBeLessThan(25);
  });

  it('takes longer for each stop it passes', () => {
    expect(flightPath(0, 50, [40, 100], 1000, 700, FLY_EASING).duration).toBe(1700);
    expect(flightPath(0, 150, [40, 100], 1000, 700, FLY_EASING).duration).toBe(2400);
  });

  it('never goes back and ends where the points say', () => {
    const path = flightPath(20, 150, [40, 100], 2000, 700, FLY_EASING);
    let last = 20;
    for (let ms = 0; ms <= path.duration; ms += 20) {
      expect(path.at(ms)).toBeGreaterThanOrEqual(last);
      last = path.at(ms);
    }

    expect(path.at(path.duration)).toBe(150);
  });

  it('lingers beside a stop it passes', () => {
    const plain = flightPath(0, 200, [], 2000, 700, FLY_EASING);
    const slow = flightPath(0, 200, [100], 2000, 700, FLY_EASING);
    /** Time spent within a few points of the stop. */
    const near = (path: typeof plain) => {
      let ms = 0;
      for (let t = 0; t <= path.duration; t += 5) {
        if (Math.abs(path.at(t) - 100) < 6) ms += 5;
      }
      return ms;
    };

    expect(near(slow)).toBeGreaterThan(near(plain) + 400);
    expect(Math.abs(slow.at(slow.passes(100)) - 100)).toBeLessThan(2);
  });

  it('counts a stop the flight ends on', () => {
    expect(flightPath(0, 40, [40], 1000, 700, FLY_EASING).duration).toBe(1700);
  });
});
