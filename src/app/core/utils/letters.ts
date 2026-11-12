import { Category } from '../models/category';
import { normalizeAnswer } from './normalize-answer';

/** Whether a text begins with the letter, whatever its accents and case: "Árvore" does with "a". */
export function startsWithLetter(text: string, letter: string): boolean {
  return normalizeAnswer(text).startsWith(normalizeAnswer(letter));
}

/** How many answers of the category begin with the letter. */
function answersWith(category: Category, letter: string): number {
  return category.answers.filter((answer) => startsWithLetter(answer.text, letter)).length;
}

/** Categories with at least `min` answers that begin with the letter. */
export function categoriesFor(
  letter: string,
  categories: readonly Category[],
  min: number,
): Category[] {
  return categories.filter((category) => answersWith(category, letter) >= min);
}

/**
 * Letters a round can be played with, in alphabetical order: the ones with enough
 * categories, each with at least `min` answers that begin with the letter. Worked out
 * from the base, so new letters come in by themselves as it grows.
 */
export function viableLetters(
  categories: readonly Category[],
  min: number,
  enoughCategories: number,
): string[] {
  return [...'abcdefghijklmnopqrstuvwxyz'].filter(
    (letter) => categoriesFor(letter, categories, min).length >= enoughCategories,
  );
}
