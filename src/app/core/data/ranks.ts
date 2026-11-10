import { Rank } from '../models/rank';

/**
 * The career, from the first round on. Experience is the sum of the points of every
 * round, in any mode: at some 200 points a round, a player is a pilot after about
 * three rounds and an admiral after about sixty.
 */
export const RANKS: readonly Rank[] = [
  { id: 'cadet', name: 'Cadete', minXp: 0 },
  { id: 'pilot', name: 'Piloto', minXp: 500 },
  { id: 'navigator', name: 'Navegador', minXp: 1500 },
  { id: 'captain', name: 'Capitão', minXp: 3500 },
  { id: 'commander', name: 'Comandante', minXp: 7000 },
  { id: 'admiral', name: 'Almirante', minXp: 12_000 },
  { id: 'legend', name: 'Lenda da Galáxia', minXp: 20_000 },
];
