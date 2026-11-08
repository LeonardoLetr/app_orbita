import { Injectable, computed, inject, signal } from '@angular/core';
import { ProgressRepository } from '../data/progress-repository';
import { EMPTY_PROGRESS, PlayerProgress, RoundRecord } from '../models/progress';

/** What a finished round changed in the player's progress. */
export interface RoundOutcome {
  isFirstRound: boolean;
  isNewBest: boolean;
  isNewPlanet: boolean;
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
  readonly bestPoints = computed(() => this.state().bestPoints);
  readonly totalRounds = computed(() => this.state().totalRounds);
  readonly reachedPlanets = computed(() => new Set(this.state().reachedPlanets));
  /** Outcome of the last round recorded in this session. */
  readonly lastOutcome = this.lastOutcomeState.asReadonly();

  constructor() {
    void this.load();
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
      isFirstRound: before.totalRounds === 0,
      isNewBest: round.points > before.bestPoints,
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
