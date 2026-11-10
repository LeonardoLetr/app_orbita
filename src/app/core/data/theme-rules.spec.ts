import { Category } from '../models/category';
import { CLASSIC_CATEGORIES, CLASSIC_RULES } from './classic-rules';
import { THEMED_MODES, THEME_MODE, modeLink } from './game-modes';
import { themeRules } from './theme-rules';
import { THEMES, categoriesOf, isThemeId, themeName } from './themes';

describe('themes', () => {
  const categories: Category[] = Array.from({ length: 30 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    themes: i % 2 ? ['nature'] : i % 4 ? ['world', 'brazil'] : ['world'],
    answers: [],
  }));

  it('have unique ids and addresses', () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    expect(new Set(THEMES.map((theme) => theme.slug)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      expect(theme.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('know their ids and names', () => {
    expect(isThemeId('nature')).toBe(true);
    expect(isThemeId('sports')).toBe(false);
    expect(themeName('science')).toBe('Ciência e espaço');
  });

  it('gather the categories that belong to them, even shared ones', () => {
    expect(categoriesOf(categories, 'nature')).toHaveLength(15);
    expect(categoriesOf(categories, 'world')).toHaveLength(15);
    expect(categoriesOf(categories, 'brazil')).toHaveLength(7);
    expect(categoriesOf([{ id: 'x', title: 'X', answers: [] }], 'nature')).toEqual([]);
  });

  it('play a classic round with categories of the theme only', () => {
    const rules = themeRules('nature');
    const picked = rules.pickCategories(categories, new Set(), () => 0.5);

    expect(picked).toHaveLength(CLASSIC_CATEGORIES);
    expect(picked.every((category) => category.themes?.includes('nature'))).toBe(true);
    expect(rules.clock).toEqual(CLASSIC_RULES.clock);
    expect(rules.maxPoints).toBe(CLASSIC_RULES.maxPoints);
  });

  it('avoid the categories of the previous round inside the theme', () => {
    const first = themeRules('nature').pickCategories(categories, new Set(), () => 0);
    const previous = new Set(first.map((category) => category.id));

    const second = themeRules('nature').pickCategories(categories, previous, () => 0);

    expect(second.some((category) => previous.has(category.id))).toBe(false);
    expect(second.every((category) => category.themes?.includes('nature'))).toBe(true);
  });

  it('each get a mode of their own, saved as the theme mode', () => {
    expect(THEMED_MODES).toHaveLength(THEMES.length);
    for (const mode of THEMED_MODES) {
      expect(mode.id).toBe('theme');
      expect(modeLink(mode)).toBe(`/jogar/tema/${mode.theme?.slug}`);
    }
    expect(modeLink(THEME_MODE)).toBe('/jogar/tema');
  });
});
