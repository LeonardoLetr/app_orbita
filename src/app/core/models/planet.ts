export type PlanetId =
  | 'earth-orbit'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'eris'
  | 'heliopause'
  | 'voyager'
  | 'oort-cloud'
  | 'proxima';

/** A stop on the journey, reached once a round scores at least `minPoints`. */
export interface Planet {
  id: PlanetId;
  name: string;
  /** Name with the right preposition, as in "chegar à Lua" or "chegar a Marte". */
  toName: string;
  minPoints: number;
  /** Approximate average distance from Earth, in km. */
  distanceKm: number;
  /** Short curiosity shown on the result screen. */
  fact: string;
}

/** The stops of a journey, from the nearest to the farthest. */
export type Route = readonly Planet[];
