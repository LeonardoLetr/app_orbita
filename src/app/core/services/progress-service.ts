import { Injectable, computed, inject, signal } from '@angular/core';
import { GAME_MODES } from '../data/game-modes';
import { ProgressRepository } from '../data/progress-repository';
import { GameMode, GameModeId } from '../models/game-mode';
import { EMPTY_PROGRESS, PlayerProgress, RoundRecord } from '../models/progress';

/** What a finished round changed in the player's progress. */
export interface RoundOutcome {
  /** First round ever played in this mode. */
  isFirstRound: boolean;
  /** Beat the record of this mode. */
  isNewBest: boolean;
  isNewPlanet: boolean;
}

/** Best score of the player in one mode. */
export interface ModeRecord {
  mode: GameMode;
  points: number;
}

/** Player history, record and reached planets, kept in sync with the repository. */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly repository = inject(ProgressRepository);
  private readonly state = signal<PlayerProgress>(EMPTY_PROGRESS);
  private readonly lastOutcomeState = signal<RoundOutcome | undefined>(undefined);
  private loading?: Promise<void>;

  readonly progress = this.state.asReadonly();
  readonly rounds = computed(() => this.state().rounds);
  /** Record in the classic mode, the one shown on the home screen. */
  readonly bestPoints = computed(() => this.bestFor('classic'));
  /** Records of the modes already played, in the order the modes are offered. */
  readonly records = computed<ModeRecord[]>(() => {
    const best = this.state().bestByMode;
    return GAME_MODES.filter((mode) => mode.id in best).map((mode) => ({
      mode,
      points: best[mode.id] ?? 0,
    }));
  });
  readonly totalRounds = computed(() => this.state().totalRounds);
  readonly reachedPlanets = computed(() => new Set(this.state().reachedPlanets));
  /** Outcome of the last round recorded in this session. */
  readonly lastOutcome = this.lastOutcomeState.asReadonly();

  constructor() {
    void this.load();
  }

  /** Best score in a mode, 0 when it was never played. */
  bestFor(mode: GameModeId): number {
    return this.state().bestByMode[mode] ?? 0;
  }

  /** Whether at least one round of the mode was played. */
  played(mode: GameModeId): boolean {
    return mode in this.state().bestByMode;
  }

  /** Loads saved progress once. A failure leaves the progress empty. */
  load(): Promise<void> {
    this.loading ??= this.repository
      .load()
      .then((progress) => this.state.set(progress))
      .catch(() => undefined);
    return this.loading;
  }

  async record(round: Omit<RoundRecord, 'id' | 'playedAt'>): Promise<RoundOutcome> {
    this.lastOutcomeState.set(undefined);
    await this.load();

    const before = this.state();
    const outcome: RoundOutcome = {
      isFirstRound: !(round.mode in before.bestByMode),
      isNewBest: round.points > (before.bestByMode[round.mode] ?? 0),
      isNewPlanet: !before.reachedPlanets.includes(round.planetId),
    };
    this.lastOutcomeState.set(outcome);

    const playedAt = new Date();
    this.state.set(
      await this.repository.addRound({
        ...round,
        id: playedAt.getTime().toString(36),
        playedAt: playedAt.toISOString(),
      }),
    );
    return outcome;
  }

  async clear(): Promise<void> {
    this.state.set(await this.repository.clear());
    this.lastOutcomeState.set(undefined);
  }
}
