import { Injectable, inject } from '@angular/core';
import { PLANETS } from '../data/planets';
import { Answer, Category } from '../models/category';
import { Planet } from '../models/planet';
import { RARITIES, Rarity } from '../models/rarity';
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
}

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

    const match = this.lookupFor(category).get(key);
    return match
      ? { input: trimmed, outcome: 'scored', points: RARITY_POINTS[match.rarity], match }
      : { input: trimmed, outcome: 'unknown', points: 0 };
  }

  /** Farthest planet reached with the given points. */
  destinationFor(points: number): Planet {
    return PLANETS.filter((planet) => points >= planet.minPoints).at(-1) ?? PLANETS[0];
  }

  /** Next planet after the one reached, or undefined at the end of the journey. */
  nextDestination(points: number): Planet | undefined {
    return PLANETS.find((planet) => planet.minPoints > points);
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
