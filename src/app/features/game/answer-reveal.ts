import { Component, computed, input } from '@angular/core';
import { AnswerOutcome, AnswerResult } from '../../core/services/scoring-service';
import { StarBurst } from '../../shared/components/star-burst';

interface Tone {
  headline: string;
  detail?: string;
  tint: string;
  text: string;
  burst?: { colors: string[]; count: number; reach: number };
}

const RARITY_TONES: Record<'satellite' | 'comet' | 'supernova', Tone> = {
  satellite: {
    headline: 'Satélite!',
    detail: 'Resposta comum',
    tint: 'border-satellite/70 bg-satellite/15',
    text: 'text-satellite',
  },
  comet: {
    headline: 'Cometa!',
    detail: 'Resposta incomum',
    tint: 'border-comet/70 bg-comet/20',
    text: 'text-comet',
    burst: { colors: ['bg-comet', 'bg-nebula-300'], count: 10, reach: 6 },
  },
  supernova: {
    headline: 'Supernova!',
    detail: 'Resposta rara',
    tint: 'border-supernova/80 bg-supernova/20',
    text: 'text-supernova',
    burst: { colors: ['bg-supernova', 'bg-star-300', 'bg-flare-500'], count: 18, reach: 9 },
  },
};

const ZERO_TONES: Record<Exclude<AnswerOutcome, 'scored'>, Tone> = {
  unknown: {
    headline: 'Fora da base',
    detail: 'Essa resposta não está na nossa lista',
    tint: 'border-space-600 bg-space-800/60',
    text: 'text-space-200',
  },
  blank: {
    headline: 'Pulou',
    detail: 'Sem resposta desta vez',
    tint: 'border-space-600 bg-space-800/60',
    text: 'text-space-200',
  },
  timeout: {
    headline: 'Tempo esgotado',
    detail: 'Não deu tempo de responder',
    tint: 'border-space-600 bg-space-800/60',
    text: 'text-space-200',
  },
};

/** Big score feedback shown over the question card right after answering. */
@Component({
  selector: 'app-answer-reveal',
  imports: [StarBurst],
  host: { class: 'absolute inset-0 block rounded-[inherit]' },
  template: `
    <div
      class="absolute inset-0 overflow-hidden rounded-[inherit] bg-space-900 motion-safe:animate-pop"
    >
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[inherit] border-2 px-4 text-center"
        [class]="tone().tint"
      >
        @if (tone().burst; as burst) {
          <app-star-burst [count]="burst.count" [colors]="burst.colors" [reach]="burst.reach" />
        }
        <p
          class="font-display text-6xl leading-none font-bold sm:text-7xl short:text-5xl"
          [class]="scored() ? tone().text : tone().text + ' motion-safe:animate-shake'"
        >
          {{ scored() ? '+' + result().points : '0' }}
        </p>
        <p class="text-2xl font-extrabold sm:text-3xl short:text-xl">{{ tone().headline }}</p>
        @if (alias(); as alias) {
          <p class="text-sm text-space-200 sm:text-base">Aceita como “{{ alias }}”</p>
        } @else if (tone().detail; as detail) {
          <p class="text-sm text-space-200 sm:text-base short:hidden">{{ detail }}</p>
        }
      </div>
    </div>
  `,
})
export class AnswerReveal {
  readonly result = input.required<AnswerResult>();

  protected readonly scored = computed(() => this.result().outcome === 'scored');

  protected readonly tone = computed<Tone>(() => {
    const { outcome, match } = this.result();
    return outcome === 'scored' && match
      ? RARITY_TONES[match.rarity]
      : ZERO_TONES[outcome as Exclude<AnswerOutcome, 'scored'>];
  });

  /** Accepted answer name when the player typed a synonym or a different spelling. */
  protected readonly alias = computed(() => {
    const { input, match } = this.result();
    return match && match.text.toLowerCase() !== input.toLowerCase() ? match.text : undefined;
  });
}
