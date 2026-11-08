import categories from '../../../../public/data/categories.json';
import { Category } from '../models/category';
import { RARITIES } from '../models/rarity';
import { normalizeAnswer } from '../utils/normalize-answer';

describe('categories.json', () => {
  const data = categories as Category[];

  it('has at least 20 categories', () => {
    expect(data.length).toBeGreaterThanOrEqual(20);
  });

  it('uses unique kebab-case ids', () => {
    const ids = data.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('gives every category a title', () => {
    for (const category of data) {
      expect(category.title.trim(), category.id).not.toBe('');
    }
  });

  it('only uses known rarity levels', () => {
    for (const category of data) {
      for (const answer of category.answers) {
        expect(RARITIES, `${category.id}: ${answer.text}`).toContain(answer.rarity);
      }
    }
  });

  it('has answers of every rarity level in each category', () => {
    for (const category of data) {
      const rarities = new Set(category.answers.map((answer) => answer.rarity));
      expect([...rarities].sort(), category.id).toEqual([...RARITIES].sort());
    }
  });

  it('never repeats an answer or synonym inside a category', () => {
    for (const category of data) {
      const terms = category.answers.flatMap((answer) => [answer.text, ...(answer.synonyms ?? [])]);
      const duplicates = terms
        .map(normalizeAnswer)
        .filter((term, index, all) => all.indexOf(term) !== index);

      expect(duplicates, category.id).toEqual([]);
    }
  });
});
