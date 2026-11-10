import { Rarity } from './rarity';
import { ThemeId } from './theme';

export interface Answer {
  /** Answer as shown to the player. */
  text: string;
  rarity: Rarity;
  /** Other spellings or names accepted as this same answer. */
  synonyms?: string[];
}

export interface Category {
  id: string;
  title: string;
  /** Themes the category belongs to, for rounds about a single theme. */
  themes?: ThemeId[];
  answers: Answer[];
}
