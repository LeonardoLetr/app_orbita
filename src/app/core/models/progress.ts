import type { AnswerResult } from '../services/scoring-service';
import { GameModeId } from './game-mode';
import { PlanetId } from './planet';
import { ThemeId } from './theme';

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
  mode: GameModeId;
  /** Theme of the round, in the mode played by theme. */
  theme?: ThemeId;
  /** Letter drawn for the round, in the mode played with one. */
  letter?: string;
  points: number;
  planetId: PlanetId;
  answers: RoundAnswer[];
}

export interface PlayerProgress {
  /** Most recent rounds, newest first. Older ones may be dropped. */
  rounds: RoundRecord[];
  /** Every round ever played, including the ones no longer in `rounds`. */
  totalRounds: number;
  /** Best score in each mode already played (a mode never played has no entry). */
  bestByMode: Partial<Record<GameModeId, number>>;
  reachedPlanets: PlanetId[];
  /** Experience: the points of every round ever played, in any mode. */
  xp: number;
}

export const EMPTY_PROGRESS: PlayerProgress = {
  rounds: [],
  totalRounds: 0,
  bestByMode: {},
  reachedPlanets: [],
  xp: 0,
};
