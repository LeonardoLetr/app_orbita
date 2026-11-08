import type { AnswerResult } from '../services/scoring-service';
import { PlanetId } from './planet';

export interface RoundAnswer {
  categoryId: string;
  categoryTitle: string;
  result: AnswerResult;
}

/** A finished round, as saved in the history. */
export interface RoundRecord {
  id: string;
  /** ISO date and time. */
  playedAt: string;
  points: number;
  planetId: PlanetId;
  timerEnabled: boolean;
  answers: RoundAnswer[];
}

export interface PlayerProgress {
  /** Most recent rounds, newest first. Older ones may be dropped. */
  rounds: RoundRecord[];
  /** Every round ever played, including the ones no longer in `rounds`. */
  totalRounds: number;
  bestPoints: number;
  reachedPlanets: PlanetId[];
}

export const EMPTY_PROGRESS: PlayerProgress = {
  rounds: [],
  totalRounds: 0,
  bestPoints: 0,
  reachedPlanets: [],
};
