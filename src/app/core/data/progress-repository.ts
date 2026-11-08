import { PlayerProgress, RoundRecord } from '../models/progress';

/**
 * Where the player's history, record and reached planets are kept.
 * Today it is the browser; later it can be a backend with classes and students.
 */
export abstract class ProgressRepository {
  abstract load(): Promise<PlayerProgress>;
  abstract addRound(round: RoundRecord): Promise<PlayerProgress>;
  abstract clear(): Promise<PlayerProgress>;
}
