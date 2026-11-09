/** From the most common answers to the rarest ones. */
export const RARITIES = ['satellite', 'meteorite', 'comet', 'pulsar', 'supernova'] as const;

/**
 * How unusual an answer is: satellite (common), meteorite, comet, pulsar
 * or supernova (the rarest).
 */
export type Rarity = (typeof RARITIES)[number];
