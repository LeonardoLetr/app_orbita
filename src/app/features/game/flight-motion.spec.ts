import { FLY_EASING, FlightMotion, ease } from './flight-motion';

describe('ease', () => {
  it('goes from 0 to 1 like the CSS easing', () => {
    expect(ease(FLY_EASING, 0)).toBe(0);
    expect(ease(FLY_EASING, 1)).toBe(1);
    expect(ease([0, 0, 1, 1], 0.3)).toBeCloseTo(0.3, 3);
    expect(ease(FLY_EASING, 0.5)).toBeGreaterThan(0.5);
  });
});

describe('FlightMotion', () => {
  it('moves the whole distance over the flight and stops after it', () => {
    const motion = new FlightMotion();
    motion.begin(1000, 2000, 400, [0, 0, 1, 1]);

    // Linear: 400 px over 2 s is 200 px per second.
    expect(motion.speed(2000)).toBeCloseTo(200, 0);
    expect(motion.speed(3100)).toBe(0);
    expect(motion.speed(900)).toBe(0);
  });

  it('is still before any flight', () => {
    expect(new FlightMotion().speed(5000)).toBe(0);
  });
});
