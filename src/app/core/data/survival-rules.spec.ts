import { Category } from '../models/category';
import { EXTENDED_ROUTE } from './planets';
import { SURVIVAL_LIVES, SURVIVAL_RULES } from './survival-rules';

describe('SURVIVAL_RULES', () => {
  const categories: Category[] = Array.from({ length: 12 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [],
  }));

  it('starts with three lives and no highest score', () => {
    expect(SURVIVAL_LIVES).toBe(3);
    expect(SURVIVAL_RULES.lives).toBe(3);
    expect(SURVIVAL_RULES.maxPoints).toBeUndefined();
  });

  it('gives each category its own clock, shorter every five categories', () => {
    const { clock } = SURVIVAL_RULES;

    expect(clock.scope).toBe('category');
    expect([0, 4, 5, 9, 10, 14, 15, 19, 20, 80].map((index) => clock.secondsAt!(index))).toEqual([
      30, 30, 25, 25, 20, 20, 15, 15, 12, 12,
    ]);
    expect(clock.seconds).toBe(30);
  });

  it('travels the route that goes past Pluto', () => {
    expect(SURVIVAL_RULES.route).toBe(EXTENDED_ROUTE);
  });

  it('asks every category once before any repeats', () => {
    const picked = SURVIVAL_RULES.pickCategories(categories, new Set(['c3']), () => 0.4);

    expect(new Set(picked.map((category) => category.id)).size).toBe(categories.length);
    expect(picked.at(-1)?.id).toBe('c3');
  });
});
