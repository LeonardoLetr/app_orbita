import { RoundRules } from '../models/round-rules';
import { ThemeId } from '../models/theme';
import { CLASSIC_RULES } from './classic-rules';
import { categoriesOf } from './themes';

/** The classic round, drawing only from the categories of one theme. */
export function themeRules(theme: ThemeId): RoundRules {
  return {
    ...CLASSIC_RULES,
    pickCategories: (all, previous, random) =>
      CLASSIC_RULES.pickCategories(categoriesOf(all, theme), previous, random),
  };
}
