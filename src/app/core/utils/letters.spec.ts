import { Category } from '../models/category';
import { categoriesFor, startsWithLetter, viableLetters } from './letters';

function category(id: string, ...answers: string[]): Category {
  return { id, title: id, answers: answers.map((text) => ({ text, rarity: 'comet' })) };
}

describe('letters', () => {
  it('ignores accents and case', () => {
    expect(startsWithLetter('Árvore', 'a')).toBe(true);
    expect(startsWithLetter('  érica', 'E')).toBe(true);
    expect(startsWithLetter('Banana', 'a')).toBe(false);
  });

  it('keeps the categories with enough answers for the letter', () => {
    const all = [category('fruit', 'Abacate', 'Açaí', 'Banana'), category('animal', 'Anta', 'Boi')];

    expect(categoriesFor('a', all, 2).map((item) => item.id)).toEqual(['fruit']);
    expect(categoriesFor('b', all, 1).map((item) => item.id)).toEqual(['fruit', 'animal']);
  });

  it('lists the letters with enough categories', () => {
    const all = [category('fruit', 'Abacate', 'Banana'), category('animal', 'Anta', 'Cão')];

    expect(viableLetters(all, 1, 2)).toEqual(['a']);
    expect(viableLetters(all, 1, 1)).toEqual(['a', 'b', 'c']);
  });
});
