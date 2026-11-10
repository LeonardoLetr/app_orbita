import { Injectable, inject } from '@angular/core';
import { PlanetId } from '../models/planet';
import { EMPTY_PROGRESS, PlayerProgress, RoundRecord } from '../models/progress';
import { STORAGE, readJson, writeJson } from '../utils/storage';
import { GAME_MODES, isGameModeId } from './game-modes';
import { EXTENDED_ROUTE } from './planets';
import { isThemeId } from './themes';
import { ProgressRepository } from './progress-repository';

export const PROGRESS_KEY = 'orbita:progress';
export const MAX_SAVED_ROUNDS = 50;
/**
 * Format of the saved data. Version 1 had a single record and rounds without a mode;
 * it is still read, as rounds of the classic mode (see `upgrade`).
 */
const VERSION = 2;

const PLANET_IDS = new Set<string>(EXTENDED_ROUTE.map((planet) => planet.id));

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
      bestByMode: {
        ...current.bestByMode,
        [round.mode]: Math.max(current.bestByMode[round.mode] ?? 0, round.points),
      },
      reachedPlanets: current.reachedPlanets.includes(round.planetId)
        ? current.reachedPlanets
        : [...current.reachedPlanets, round.planetId],
      xp: current.xp + Math.max(0, round.points),
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
    const saved = upgrade(readJson(this.store, PROGRESS_KEY));
    if (!saved) {
      return EMPTY_PROGRESS;
    }

    const rounds = Array.isArray(saved['rounds']) ? saved['rounds'].filter(isRoundRecord) : [];
    const reachedPlanets = Array.isArray(saved['reachedPlanets'])
      ? saved['reachedPlanets'].filter((id): id is PlanetId => PLANET_IDS.has(id))
      : [];

    return {
      rounds,
      totalRounds: Math.max(toCount(saved['totalRounds']), rounds.length),
      bestByMode: toBestByMode(saved['bestByMode'], rounds),
      reachedPlanets,
      xp: toXp(saved['xp'], rounds),
    };
  }
}

/**
 * Brings data saved by an older version to the current format. Gives nothing back for
 * data that is missing, broken or from a version this code does not know.
 */
function upgrade(saved: unknown): Record<string, unknown> | undefined {
  if (!isRecord(saved)) {
    return undefined;
  }
  if (saved['version'] === VERSION) {
    return saved;
  }
  if (saved['version'] === 1) {
    const rounds = Array.isArray(saved['rounds']) ? saved['rounds'] : [];
    const played = rounds.length > 0 || toCount(saved['totalRounds']) > 0;
    return {
      ...saved,
      version: VERSION,
      rounds: rounds.map(upgradeRound),
      bestByMode: played ? { classic: saved['bestPoints'] } : {},
    };
  }
  return undefined;
}

/** Version 1 only had the classic mode, and a timer switch that no longer exists. */
function upgradeRound(round: unknown): unknown {
  if (!isRecord(round)) {
    return round;
  }
  const upgraded: Record<string, unknown> = { ...round, mode: 'classic' };
  delete upgraded['timerEnabled'];
  return upgraded;
}

/** Records of the modes that exist, never below the saved rounds of each mode. */
function toBestByMode(value: unknown, rounds: RoundRecord[]): PlayerProgress['bestByMode'] {
  const best: PlayerProgress['bestByMode'] = {};
  if (isRecord(value)) {
    for (const { id } of GAME_MODES) {
      if (id in value) {
        best[id] = toCount(value[id]);
      }
    }
  }
  for (const round of rounds) {
    best[round.mode] = Math.max(best[round.mode] ?? 0, round.points);
  }
  return best;
}

/**
 * Experience saved, or, for progress saved before there were ranks, the points of the
 * rounds still in the history (an estimate: only the latest rounds are kept).
 */
function toXp(value: unknown, rounds: RoundRecord[]): number {
  return typeof value === 'number'
    ? toCount(value)
    : rounds.reduce((total, round) => total + Math.max(0, round.points), 0);
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
    isGameModeId(value['mode']) &&
    (value['theme'] === undefined || isThemeId(value['theme'])) &&
    PLANET_IDS.has(value['planetId'] as string) &&
    Array.isArray(value['answers'])
  );
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
