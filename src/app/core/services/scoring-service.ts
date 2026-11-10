import { Injectable, inject } from '@angular/core';
import { PLANETS } from '../data/planets';
import { Answer, Category } from '../models/category';
import { Planet, Route } from '../models/planet';
import { RARITIES, Rarity } from '../models/rarity';
import { editDistance } from '../utils/edit-distance';
import { normalizeAnswer } from '../utils/normalize-answer';
import { pickRandom } from '../utils/pick-random';
import { RANDOM } from '../utils/random';

export const RARITY_POINTS: Record<Rarity, number> = {
  satellite: 10,
  meteorite: 25,
  comet: 50,
  pulsar: 75,
  supernova: 100,
};

/**
 * - scored: matched an accepted answer
 * - unknown: typed something that is not in the category base
 * - blank: confirmed without typing anything
 * - timeout: time ran out with nothing typed
 */
export type AnswerOutcome = 'scored' | 'unknown' | 'blank' | 'timeout';

export interface AnswerResult {
  /** What the player typed, trimmed. */
  input: string;
  outcome: AnswerOutcome;
  points: number;
  /** Accepted answer that matched, when the outcome is "scored". */
  match?: Answer;
  /** True when a one-letter typo was forgiven to find the match. */
  corrected?: boolean;
}

/** Shorter answers must be exact: one letter changes too much in "Sol" or "Rio". */
const MIN_CORRECTION_LENGTH = 4;

@Injectable({ providedIn: 'root' })
export class ScoringService {
  private readonly random = inject(RANDOM);
  private readonly lookups = new WeakMap<Category, Map<string, Answer>>();

  score(category: Category, input: string, timedOut = false): AnswerResult {
    const trimmed = input.trim();
    const key = normalizeAnswer(trimmed);

    if (!key) {
      return { input: '', outcome: timedOut ? 'timeout' : 'blank', points: 0 };
    }

    const lookup = this.lookupFor(category);
    const exact = lookup.get(key);
    if (exact) {
      return {
        input: trimmed,
        outcome: 'scored',
        points: RARITY_POINTS[exact.rarity],
        match: exact,
      };
    }
    const corrected = this.closeMatch(lookup, key);
    if (corrected) {
      return {
        input: trimmed,
        outcome: 'scored',
        points: RARITY_POINTS[corrected.rarity],
        match: corrected,
        corrected: true,
      };
    }
    return { input: trimmed, outcome: 'unknown', points: 0 };
  }

  /** The only answer one letter away from the typed text, if there is exactly one. */
  private closeMatch(lookup: Map<string, Answer>, key: string): Answer | undefined {
    if (key.length < MIN_CORRECTION_LENGTH) {
      return undefined;
    }
    const candidates = new Set<Answer>();
    for (const [term, answer] of lookup) {
      if (editDistance(term, key, 1) <= 1) {
        candidates.add(answer);
      }
    }
    return candidates.size === 1 ? [...candidates][0] : undefined;
  }

  /** Farthest planet reached with the given points. */
  destinationFor(points: number, route: Route = PLANETS): Planet {
    return route.filter((planet) => points >= planet.minPoints).at(-1) ?? route[0];
  }

  /** Next planet after the one reached, or undefined at the end of the journey. */
  nextDestination(points: number, route: Route = PLANETS): Planet | undefined {
    return route.find((planet) => planet.minPoints > points);
  }

  /**
   * Some of the rarest answers of a category, in random order, to show what
   * else would have scored high. Falls back to less rare answers when needed.
   */
  rarestAnswers(category: Category, limit = 3, exclude?: Answer): Answer[] {
    const candidates = category.answers.filter((answer) => answer !== exclude);
    return pickRandom(candidates, candidates.length, this.random)
      .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity))
      .slice(0, limit);
  }

  /** Maps every normalized answer and synonym of a category to its answer. */
  private lookupFor(category: Category): Map<string, Answer> {
    let lookup = this.lookups.get(category);
    if (!lookup) {
      lookup = new Map();
      for (const answer of category.answers) {
        for (const term of [answer.text, ...(answer.synonyms ?? [])]) {
          lookup.set(normalizeAnswer(term), answer);
        }
      }
      this.lookups.set(category, lookup);
    }
    return lookup;
  }
}
