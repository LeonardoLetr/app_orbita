import { RoundRules } from '../models/round-rules';
import { CLASSIC_CATEGORIES, CLASSIC_RULES } from './classic-rules';

/** Answers with the letter a category needs to be asked in a round of that letter. */
export const LETTER_ANSWERS = 5;

/** Categories a letter needs to be drawn: the ones of a round. */
export const LETTER_CATEGORIES = CLASSIC_CATEGORIES;

/** The classic round, where every answer has to begin with the letter drawn for it. */
export const LETTER_RULES: RoundRules = {
  ...CLASSIC_RULES,
  letterAnswers: LETTER_ANSWERS,
};
