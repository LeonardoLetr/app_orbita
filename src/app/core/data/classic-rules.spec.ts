import { Category } from '../models/category';
import { CLASSIC_CATEGORIES, CLASSIC_RULES } from './classic-rules';

describe('CLASSIC_RULES', () => {
  const categories: Category[] = Array.from({ length: 16 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [],
  }));
  const first = () => 0;

  it('draws seven distinct categories', () => {
    const picked = CLASSIC_RULES.pickCategories(categories, new Set(), first);

    expect(picked).toHaveLength(CLASSIC_CATEGORIES);
    expect(new Set(picked.map((category) => category.id)).size).toBe(CLASSIC_CATEGORIES);
  });

  it('avoids the categories of the previous round', () => {
    const previous = new Set(categories.slice(0, 7).map((category) => category.id));

    const picked = CLASSIC_RULES.pickCategories(categories, previous, first);

    expect(picked.some((category) => previous.has(category.id))).toBe(false);
  });

  it('repeats categories when there are not enough new ones', () => {
    const previous = new Set(categories.slice(0, 12).map((category) => category.id));

    expect(CLASSIC_RULES.pickCategories(categories, previous, first)).toHaveLength(
      CLASSIC_CATEGORIES,
    );
  });

  it('gives half a minute to each category, at a calm pace', () => {
    expect(CLASSIC_RULES.clock).toEqual({ scope: 'category', seconds: 30 });
    expect(CLASSIC_RULES.pace).toBe('calm');
  });

  it('can reach at most seven supernovas', () => {
    expect(CLASSIC_RULES.maxPoints).toBe(700);
  });
});
