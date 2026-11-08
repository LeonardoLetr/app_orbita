import { Rarity } from './rarity';

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
  answers: Answer[];
}
