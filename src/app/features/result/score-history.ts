import { Component, computed, input } from '@angular/core';
import { RoundRecord } from '../../core/models/progress';

const SHOWN_ROUNDS = 12;
/** Without a highest score, the scale ends on the next multiple of this above the best round. */
const SCALE_STEP = 100;
const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Bars of the player's latest rounds, oldest to newest, with this round highlighted
 * and a dashed line at the average. Uses an emphasis palette (one accent, the rest gray).
 */
@Component({
  selector: 'app-score-history',
  host: { class: 'block' },
  template: `
    <figure class="panel p-4 sm:p-5">
      <figcaption class="flex flex-wrap items-baseline justify-between gap-x-3">
        <span class="font-display text-xl tracking-wide">Suas últimas partidas</span>
        <span class="text-sm whitespace-nowrap text-space-200">média {{ average() }} pts</span>
      </figcaption>

      <div class="relative mt-6 h-32 sm:h-40" aria-hidden="true">
        <span class="absolute -top-5 left-0 text-[0.7rem] text-space-200">{{ topLabel() }}</span>
        <div
          class="absolute inset-y-0 right-10 left-0 flex items-end gap-[2px] border-b border-space-700"
        >
          @for (bar of bars(); track bar.id; let i = $index) {
            <div class="group relative flex h-full min-w-0 flex-1 items-end justify-center">
              @if (bar.current) {
                <span
                  class="value absolute text-xs font-bold text-space-50"
                  [style.bottom]="'calc(' + bar.height + '% + 0.2rem)'"
                  [style.animation-delay.ms]="delay() + i * 60 + 450"
                >
                  {{ bar.points }}
                </span>
              }
              <div
                class="bar w-full max-w-7 rounded-t-[4px]"
                [class]="bar.current ? 'bg-[#c78600]' : 'bg-[#6b5a9e]'"
                [style.height.%]="bar.height"
                [style.animation-delay.ms]="delay() + i * 60"
              ></div>
              <span
                class="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-lg bg-space-950 px-2 py-1 text-xs whitespace-nowrap text-space-50 shadow-lg group-hover:block"
              >
                {{ bar.date }} · {{ bar.points }} pts
              </span>
            </div>
          }
        </div>
        <!-- The average sits over the bars, labeled in the gutter on the right. -->
        <div
          class="average absolute inset-x-0 flex items-center"
          [style.bottom.%]="averageHeight()"
          [style.animation-delay.ms]="delay() + bars().length * 60 + 300"
        >
          <span class="mr-1 flex-1 border-t border-dashed border-space-200/80"></span>
          <span class="w-9 translate-y-[0.05rem] text-[0.7rem] leading-none text-space-200">
            média
          </span>
        </div>
      </div>
      <div class="mt-1 mr-10 flex gap-[2px] text-[0.7rem] text-space-200" aria-hidden="true">
        @for (bar of bars(); track bar.id) {
          <span class="min-w-0 flex-1 text-center">{{ bar.current ? 'agora' : '' }}</span>
        }
      </div>

      <!-- Wrapped, because a table ignores the tiny size that hides it and widens the page. -->
      <div class="sr-only">
        <table>
          <caption>
            Pontos das últimas partidas, da mais antiga para a mais recente
          </caption>
          <thead>
            <tr>
              <th scope="col">Partida</th>
              <th scope="col">Pontos</th>
            </tr>
          </thead>
          <tbody>
            @for (bar of bars(); track bar.id) {
              <tr>
                <td>{{ bar.current ? 'Esta partida' : bar.date }}</td>
                <td>{{ bar.points }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </figure>
  `,
  styles: `
    .bar {
      transform-origin: bottom;
    }

    @media (prefers-reduced-motion: no-preference) {
      .bar {
        animation: grow 600ms cubic-bezier(0.2, 0.8, 0.3, 1) both;
      }
    }

    .average {
      translate: 0 50%;
    }

    @media (prefers-reduced-motion: no-preference) {
      .value,
      .average {
        animation: appear 300ms ease-out both;
      }
    }

    @keyframes grow {
      from {
        scale: 1 0;
      }
    }

    @keyframes appear {
      from {
        opacity: 0;
      }
    }
  `,
})
export class ScoreHistory {
  /** Saved rounds of one mode, newest first, as kept by the progress service. */
  readonly rounds = input.required<RoundRecord[]>();
  /** Highest score a round of this mode can reach, when there is one: the top of the scale. */
  readonly max = input<number>();
  /** The round just played, highlighted. */
  readonly currentId = input<string>();
  /** When the bars start growing, in milliseconds. */
  readonly delay = input(0);

  private readonly shown = computed(() => this.rounds().slice(0, SHOWN_ROUNDS).reverse());

  /** Top of the scale. Open-ended modes get a round number just above the best round on show. */
  protected readonly top = computed(() => {
    const best = Math.max(0, ...this.shown().map((round) => round.points));
    return this.max() ?? Math.max(SCALE_STEP, Math.ceil(best / SCALE_STEP) * SCALE_STEP);
  });
  protected readonly topLabel = computed(() =>
    this.max() ? `máx. ${this.top()}` : `${this.top()} pts`,
  );

  protected readonly bars = computed(() =>
    this.shown().map((round) => ({
      id: round.id,
      points: round.points,
      height: Math.min(100, (round.points / this.top()) * 100),
      current: round.id === this.currentId(),
      date: DATE.format(new Date(round.playedAt)),
    })),
  );

  protected readonly average = computed(() => {
    const bars = this.bars();
    return bars.length
      ? Math.round(bars.reduce((sum, bar) => sum + bar.points, 0) / bars.length)
      : 0;
  });

  protected readonly averageHeight = computed(() =>
    Math.min(100, (this.average() / this.top()) * 100),
  );
}
