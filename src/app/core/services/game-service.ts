import { Injectable, PendingTasks, computed, inject, signal } from '@angular/core';
import { CategoryRepository } from '../data/category-repository';
import { Category } from '../models/category';
import { pickRandom } from '../utils/pick-random';
import { RANDOM } from '../utils/random';
import { PreferencesService } from './preferences-service';
import { ProgressService } from './progress-service';
import { AnswerResult, ScoringService } from './scoring-service';

export const CATEGORIES_PER_ROUND = 7;
export const SECONDS_PER_CATEGORY = 30;

export interface RoundEntry {
  category: Category;
  result?: AnswerResult;
}

/**
 * - loading / error: fetching categories for a new round
 * - playing: waiting for the answer to the current category
 * - revealing: current category answered, showing its score
 * - finished: every category answered
 */
export type RoundStatus = 'idle' | 'loading' | 'error' | 'playing' | 'revealing' | 'finished';

/** Holds the state of the current round: drawn categories, answers and score. */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly repository = inject(CategoryRepository);
  private readonly scoring = inject(ScoringService);
  private readonly random = inject(RANDOM);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly progress = inject(ProgressService);

  private readonly loadState = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  private readonly entriesState = signal<RoundEntry[]>([]);
  private readonly indexState = signal(0);

  /** Player preference, remembered on this device: whether each category has a countdown. */
  readonly timerEnabled = inject(PreferencesService).timerEnabled;

  readonly entries = this.entriesState.asReadonly();
  readonly index = this.indexState.asReadonly();
  readonly current = computed<RoundEntry | undefined>(() => this.entries()[this.index()]);
  readonly totalPoints = computed(() =>
    this.entries().reduce((total, entry) => total + (entry.result?.points ?? 0), 0),
  );

  readonly status = computed<RoundStatus>(() => {
    const load = this.loadState();
    if (load !== 'ready') {
      return load;
    }
    const current = this.current();
    if (!current) {
      return 'finished';
    }
    return current.result ? 'revealing' : 'playing';
  });

  /** Draws new categories, avoiding the ones from the previous round when possible. */
  async start(): Promise<void> {
    const done = this.pendingTasks.add();
    this.loadState.set('loading');
    try {
      const categories = await this.repository.getAll();
      const previous = new Set(this.entries().map((entry) => entry.category.id));
      const fresh = categories.filter((category) => !previous.has(category.id));
      const pool = fresh.length >= CATEGORIES_PER_ROUND ? fresh : categories;

      this.entriesState.set(
        pickRandom(pool, CATEGORIES_PER_ROUND, this.random).map((category) => ({ category })),
      );
      this.indexState.set(0);
      this.loadState.set('ready');
    } catch {
      this.loadState.set('error');
    } finally {
      done();
    }
  }

  /** Scores the answer for the current category. Ignored unless a category is being played. */
  answer(input: string, timedOut = false): AnswerResult | undefined {
    if (this.status() !== 'playing') {
      return undefined;
    }
    const index = this.index();
    const result = this.scoring.score(this.entries()[index].category, input, timedOut);
    this.entriesState.update((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, result } : entry)),
    );
    return result;
  }

  /** Moves on after the current answer has been revealed, saving the round at the end. */
  next(): void {
    if (this.status() !== 'revealing') {
      return;
    }
    this.indexState.update((index) => index + 1);
    if (this.status() === 'finished') {
      void this.saveRound();
    }
  }

  private saveRound() {
    const points = this.totalPoints();
    return this.progress.record({
      points,
      planetId: this.scoring.destinationFor(points).id,
      timerEnabled: this.timerEnabled(),
      answers: this.entries().map(({ category, result }) => ({
        categoryId: category.id,
        categoryTitle: category.title,
        // Keep only what the history shows, without the synonyms list.
        result: result?.match
          ? { ...result, match: { text: result.match.text, rarity: result.match.rarity } }
          : (result ?? { input: '', outcome: 'blank', points: 0 }),
      })),
    });
  }
}
