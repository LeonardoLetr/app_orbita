export const RARITIES = ['satellite', 'comet', 'supernova'] as const;

/** How unusual an answer is: satellite (common), comet (uncommon) or supernova (rare). */
export type Rarity = (typeof RARITIES)[number];
