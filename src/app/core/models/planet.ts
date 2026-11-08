export type PlanetId =
  'earth-orbit' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

/** A stop on the journey, reached once a round scores at least `minPoints`. */
export interface Planet {
  id: PlanetId;
  name: string;
  minPoints: number;
  /** Short curiosity shown on the result screen. */
  fact: string;
}
