/**
 * Puts an answer in a canonical form so that "  São-Paulo " and "sao paulo"
 * compare as equal: lowercase, no accents, no apostrophes, punctuation turned
 * into spaces and repeated spaces collapsed.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['’`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
