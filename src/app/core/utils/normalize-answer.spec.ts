import { normalizeAnswer } from './normalize-answer';

describe('normalizeAnswer', () => {
  it('lowercases the text', () => {
    expect(normalizeAnswer('BRASIL')).toBe('brasil');
  });

  it('removes accents and cedillas', () => {
    expect(normalizeAnswer('Maçã')).toBe('maca');
    expect(normalizeAnswer('Júpiter')).toBe('jupiter');
    expect(normalizeAnswer('pão')).toBe('pao');
  });

  it('trims and collapses spaces', () => {
    expect(normalizeAnswer('  rio   de  janeiro ')).toBe('rio de janeiro');
  });

  it('treats hyphens and punctuation as spaces', () => {
    expect(normalizeAnswer('Peixe-boi')).toBe('peixe boi');
    expect(normalizeAnswer('mula sem cabeça.')).toBe('mula sem cabeca');
  });

  it('drops apostrophes', () => {
    expect(normalizeAnswer("Pau-d'alho")).toBe('pau dalho');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeAnswer('   ')).toBe('');
  });
});
