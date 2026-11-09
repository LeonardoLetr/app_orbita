import { Component, computed, input } from '@angular/core';
import { Rarity } from '../../core/models/rarity';
import { AnswerOutcome, AnswerResult } from '../../core/services/scoring-service';

export const RARITY_LABELS: Record<Rarity, string> = {
  satellite: 'Satélite',
  meteorite: 'Meteorito',
  comet: 'Cometa',
  pulsar: 'Pulsar',
  supernova: 'Supernova',
};

const OUTCOME_LABELS: Record<Exclude<AnswerOutcome, 'scored'>, string> = {
  unknown: 'Fora da base',
  blank: 'Em branco',
  timeout: 'Tempo esgotado',
};

/** Solid stickers in the level color, with dark lettering. */
const RARITY_STYLES: Record<Rarity, string> = {
  satellite: 'border-ink bg-satellite text-ink',
  meteorite: 'border-ink bg-meteorite text-ink',
  comet: 'border-ink bg-comet text-ink',
  pulsar: 'border-ink bg-pulsar text-ink',
  supernova: 'border-ink bg-supernova text-ink',
};

const NEUTRAL_STYLE = 'border-space-600 bg-space-800 text-space-200';

/** Pill showing how an answer scored, e.g. "Cometa +50" or "Fora da base". */
@Component({
  selector: 'app-rarity-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center rounded-full border-[3px] px-[1em] py-[0.2em] font-display tracking-wide whitespace-nowrap"
      [class]="style()"
    >
      {{ label() }}
    </span>
  `,
})
export class RarityBadge {
  readonly result = input.required<AnswerResult>();

  protected readonly label = computed(() => {
    const { outcome, match, points } = this.result();
    return outcome === 'scored' && match
      ? `${RARITY_LABELS[match.rarity]} +${points}`
      : OUTCOME_LABELS[outcome as Exclude<AnswerOutcome, 'scored'>];
  });

  protected readonly style = computed(() => {
    const match = this.result().match;
    return match ? RARITY_STYLES[match.rarity] : NEUTRAL_STYLE;
  });
}
