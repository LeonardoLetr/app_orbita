export type PlanetId =
  'earth-orbit' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

/** A stop on the journey, reached once a round scores at least `minPoints`. */
export interface Planet {
  id: PlanetId;
  name: string;
  /** Name with the right preposition, as in "chegar à Lua" or "chegar a Marte". */
  toName: string;
  minPoints: number;
  /** Short curiosity shown on the result screen. */
  fact: string;
}
