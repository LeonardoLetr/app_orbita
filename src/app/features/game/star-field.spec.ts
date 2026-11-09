import { starCount } from './star-field';

describe('starCount', () => {
  it('keeps the same density on any screen, within limits', () => {
    expect(starCount(390, 1000)).toBe(122);
    expect(starCount(390, 2000)).toBe(244);
    expect(starCount(100, 100)).toBe(60);
    expect(starCount(4000, 4000)).toBe(420);
  });
});
