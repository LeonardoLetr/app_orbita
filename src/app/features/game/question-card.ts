import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Category } from '../../core/models/category';
import { Rarity } from '../../core/models/rarity';
import { AnswerResult } from '../../core/services/scoring-service';
import { RARITY_LABELS } from '../../shared/components/rarity-badge';
import { StarBurst } from '../../shared/components/star-burst';

/** What the back of the card shows once the answer is scored. */
export interface CardBack {
  title: string;
  points: number;
  /** Background class in the level color. */
  tone: string;
  /** Stars bursting out, for the rarer levels. */
  stars: number;
  /** Distance travelled, already formatted. */
  km?: string;
  /** Right spelling, when the answer counted as a synonym or with a typo forgiven. */
  note?: string;
}

const LEVEL_LOOKS: Record<Rarity, { tone: string; stars: number }> = {
  satellite: { tone: 'bg-satellite', stars: 0 },
  meteorite: { tone: 'bg-meteorite', stars: 0 },
  comet: { tone: 'bg-comet', stars: 8 },
  pulsar: { tone: 'bg-pulsar', stars: 10 },
  supernova: { tone: 'bg-supernova', stars: 14 },
};

const ZERO_TITLES = {
  unknown: 'Fora da lista',
  blank: 'Pulou',
  timeout: 'Tempo esgotado',
  'wrong-letter': 'Letra errada',
} as const;

/** How long the previous card takes to fly away when a new one comes in. */
export const DEAL_MS = 500;

/**
 * `timeUp` says the clock of the whole round ran out with this answer: when it scored
 * nothing, that is what the card tells, whatever was left typed.
 */
export function cardBack(result: AnswerResult, km?: string, timeUp = false): CardBack {
  if (!result.match) {
    const title = ZERO_TITLES[timeUp ? 'timeout' : (result.outcome as keyof typeof ZERO_TITLES)];
    return { title, points: 0, tone: 'bg-space-200', stars: 0 };
  }
  const look = LEVEL_LOOKS[result.match.rarity];
  return {
    title: RARITY_LABELS[result.match.rarity],
    points: result.points,
    tone: look.tone,
    stars: look.stars,
    km,
    note:
      result.match.text.toLowerCase() !== result.input.toLowerCase()
        ? result.match.text
        : undefined,
  };
}

/**
 * The category as a card on top of the screen. It turns over to show how the answer
 * scored, always above the phone keyboard, and the next category is dealt as a new
 * card while the old one flies away.
 */
@Component({
  selector: 'app-question-card',
  imports: [NgTemplateOutlet, StarBurst],
  templateUrl: './question-card.html',
  styleUrl: './question-card.css',
  host: { class: 'relative block', '[class.is-waiting]': 'waiting()' },
})
export class QuestionCard {
  readonly category = input.required<Category>();
  /** Position of the category in the round, from 1. */
  readonly number = input.required<number>();
  /** Next destination and the points still missing; nothing at the end of the route. */
  readonly next = input<{ name: string; missing: number }>();
  /** Letter every answer has to begin with, in rounds played with one. */
  readonly letter = input<string>();
  /** Result of the answer, shown on the back. */
  readonly result = input<AnswerResult>();
  /** Distance the rocket travelled for this answer, already formatted. */
  readonly km = input<string>();
  /** Kept out of sight (with its space saved) until the launch ends, then dealt. */
  readonly waiting = input(false);
  /** The clock of the whole round ran out: this card is the last one. */
  readonly timeUp = input(false);

  protected readonly back = computed(() => {
    const result = this.result();
    return result ? cardBack(result, this.km(), this.timeUp()) : undefined;
  });

  /** The back of the previous card, flying away while the new one comes in. */
  protected readonly leaving = signal<CardBack | undefined>(undefined);

  constructor() {
    let shown: { id: string; back?: CardBack } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const id = this.category().id;
      const back = this.back();
      untracked(() => {
        if (shown && shown.id !== id && shown.back) {
          this.leaving.set(shown.back);
          clearTimeout(timer);
          timer = setTimeout(() => this.leaving.set(undefined), DEAL_MS);
        }
        shown = { id, back: back ?? (shown?.id === id ? shown.back : undefined) };
      });
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}
