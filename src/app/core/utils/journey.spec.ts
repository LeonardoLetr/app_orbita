import { reachedIndex, routePosition } from './journey';

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
