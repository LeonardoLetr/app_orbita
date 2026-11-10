import { Injectable, PendingTasks, computed, inject, signal } from '@angular/core';
import { CategoryRepository } from '../data/category-repository';
import { CLASSIC_MODE } from '../data/game-modes';
import { Category } from '../models/category';
import { GameMode } from '../models/game-mode';
import { RANDOM } from '../utils/random';
import { ProgressService } from './progress-service';
import { AnswerResult, ScoringService } from './scoring-service';

/** Categories kept away from the start of a new draw in a round that asks them all again. */
const RECENT_CATEGORIES = 7;

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

/**
 * Holds the state of the current round: drawn categories, answers and score. What the
 * round is like (how many categories, how long for each) comes from the rules of its mode.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly repository = inject(CategoryRepository);
  private readonly scoring = inject(ScoringService);
  private readonly random = inject(RANDOM);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly progress = inject(ProgressService);

  private readonly loadState = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  private readonly modeState = signal<GameMode>(CLASSIC_MODE);
  private readonly entriesState = signal<RoundEntry[]>([]);
  private readonly indexState = signal(0);
  private categories: Category[] = [];

  /** Each category has a countdown; it is part of the game. Turned off only in tests. */
  readonly timerEnabled = signal(true);

  /** Mode of the current round. */
  readonly mode = this.modeState.asReadonly();
  readonly entries = this.entriesState.asReadonly();
  readonly index = this.indexState.asReadonly();
  readonly current = computed<RoundEntry | undefined>(() => this.entries()[this.index()]);
  readonly totalPoints = computed(() =>
    this.entries().reduce((total, entry) => total + (entry.result?.points ?? 0), 0),
  );

  /** Lives left, in modes played with lives. One goes with each category left without a valid answer. */
  readonly lives = computed(() => {
    const lives = this.mode().rules.lives;
    if (lives === undefined) {
      return undefined;
    }
    const missed = this.entries().filter((entry) => entry.result && !entry.result.match).length;
    return Math.max(0, lives - missed);
  });

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

  /** Starts a round in the given mode, with the categories its rules pick. */
  async start(mode: GameMode = CLASSIC_MODE): Promise<void> {
    const done = this.pendingTasks.add();
    this.loadState.set('loading');
    try {
      const categories = await this.repository.getAll();
      this.categories = categories;
      const previous = new Set(this.entries().map((entry) => entry.category.id));

      this.modeState.set(mode);
      this.entriesState.set(
        mode.rules
          .pickCategories(categories, previous, this.random)
          .map((category) => ({ category })),
      );
      this.indexState.set(0);
      this.loadState.set('ready');
    } catch {
      this.loadState.set('error');
    } finally {
      done();
    }
  }

  /**
   * Scores the answer for the current category. Ignored unless a category is being played.
   * An answer that is not in the base is returned but not kept while there is time left,
   * so the player can try another one.
   */
  answer(input: string, timedOut = false): AnswerResult | undefined {
    if (this.status() !== 'playing') {
      return undefined;
    }
    const index = this.index();
    const result = this.scoring.score(this.entries()[index].category, input, timedOut);
    if (result.outcome === 'unknown' && !timedOut) {
      return result;
    }
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
    const lives = this.lives();
    if (lives === 0) {
      this.dropUnasked();
    } else if (lives !== undefined && this.index() + 1 >= this.entries().length) {
      this.drawAgain();
    }
    this.indexState.update((index) => index + 1);
    if (this.status() === 'finished') {
      void this.saveRound();
    }
  }

  /**
   * Ends the round after the answer being revealed, leaving out the categories that were
   * never asked. For rounds that end by the clock, not by running out of categories.
   */
  finish(): void {
    if (this.status() !== 'revealing') {
      return;
    }
    this.dropUnasked();
    this.next();
  }

  private dropUnasked(): void {
    const asked = this.index() + 1;
    this.entriesState.update((entries) => entries.slice(0, asked));
  }

  /** Every category was asked and the round goes on: draws them again, the latest ones last. */
  private drawAgain(): void {
    const latest = new Set(
      this.entries()
        .slice(-RECENT_CATEGORIES)
        .map((entry) => entry.category.id),
    );
    const more = this.mode().rules.pickCategories(this.categories, latest, this.random);
    this.entriesState.update((entries) => [...entries, ...more.map((category) => ({ category }))]);
  }

  private saveRound() {
    const points = this.totalPoints();
    return this.progress.record({
      points,
      mode: this.mode().id,
      ...(this.mode().theme ? { theme: this.mode().theme?.id } : {}),
      planetId: this.scoring.destinationFor(points, this.mode().rules.route).id,
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
