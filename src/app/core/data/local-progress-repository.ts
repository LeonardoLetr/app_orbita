import { Injectable, inject } from '@angular/core';
import { PlanetId } from '../models/planet';
import { EMPTY_PROGRESS, PlayerProgress, RoundRecord } from '../models/progress';
import { STORAGE, readJson, writeJson } from '../utils/storage';
import { PLANETS } from './planets';
import { ProgressRepository } from './progress-repository';

export const PROGRESS_KEY = 'orbita:progress';
export const MAX_SAVED_ROUNDS = 50;
const VERSION = 1;

const PLANET_IDS = new Set<string>(PLANETS.map((planet) => planet.id));

/** Saves progress in the browser, so it stays on this device only. */
@Injectable()
export class LocalProgressRepository extends ProgressRepository {
  private readonly store = inject(STORAGE);

  async load(): Promise<PlayerProgress> {
    return this.read();
  }

  async addRound(round: RoundRecord): Promise<PlayerProgress> {
    const current = this.read();
    const progress: PlayerProgress = {
      rounds: [round, ...current.rounds].slice(0, MAX_SAVED_ROUNDS),
      totalRounds: current.totalRounds + 1,
      bestPoints: Math.max(current.bestPoints, round.points),
      reachedPlanets: current.reachedPlanets.includes(round.planetId)
        ? current.reachedPlanets
        : [...current.reachedPlanets, round.planetId],
    };
    writeJson(this.store, PROGRESS_KEY, { version: VERSION, ...progress });
    return progress;
  }

  async clear(): Promise<PlayerProgress> {
    try {
      this.store.removeItem(PROGRESS_KEY);
    } catch {
      // Storage blocked: there is nothing saved to remove.
    }
    return EMPTY_PROGRESS;
  }

  /** Reads saved progress, falling back to empty progress when it is missing or broken. */
  private read(): PlayerProgress {
    const saved = readJson(this.store, PROGRESS_KEY);
    if (!isRecord(saved) || saved['version'] !== VERSION) {
      return EMPTY_PROGRESS;
    }

    const rounds = Array.isArray(saved['rounds']) ? saved['rounds'].filter(isRoundRecord) : [];
    const reachedPlanets = Array.isArray(saved['reachedPlanets'])
      ? saved['reachedPlanets'].filter((id): id is PlanetId => PLANET_IDS.has(id))
      : [];

    return {
      rounds,
      totalRounds: Math.max(toCount(saved['totalRounds']), rounds.length),
      bestPoints: toCount(saved['bestPoints']),
      reachedPlanets,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRoundRecord(value: unknown): value is RoundRecord {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['playedAt'] === 'string' &&
    typeof value['points'] === 'number' &&
    PLANET_IDS.has(value['planetId'] as string) &&
    Array.isArray(value['answers'])
  );
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
