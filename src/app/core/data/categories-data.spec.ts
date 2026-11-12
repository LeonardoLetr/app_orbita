import categories from '../../../../public/data/categories.json';
import { Category } from '../models/category';
import { MIN_THEME_CATEGORIES, THEMES, categoriesOf, isThemeId } from './themes';
import { RARITIES } from '../models/rarity';
import { viableLetters } from '../utils/letters';
import { normalizeAnswer } from '../utils/normalize-answer';
import { LETTER_ANSWERS, LETTER_CATEGORIES } from './letter-rules';

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

  it('puts every category in at least one theme that exists', () => {
    for (const category of data) {
      expect(category.themes?.length, category.id).toBeGreaterThan(0);
      for (const theme of category.themes ?? []) {
        expect(isThemeId(theme), `${category.id}: ${theme}`).toBe(true);
      }
    }
  });

  it('has enough categories in every theme for its rounds to vary', () => {
    for (const theme of THEMES) {
      expect(categoriesOf(data, theme.id).length, theme.id).toBeGreaterThanOrEqual(
        MIN_THEME_CATEGORIES,
      );
    }
  });

  it('has enough letters for the mode played with a drawn letter', () => {
    expect(viableLetters(data, LETTER_ANSWERS, LETTER_CATEGORIES).length).toBeGreaterThanOrEqual(8);
  });
});
