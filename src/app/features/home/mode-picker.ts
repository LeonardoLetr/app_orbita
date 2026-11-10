import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { modeLink } from '../../core/data/game-modes';
import { GameMode } from '../../core/models/game-mode';
import { ProgressService } from '../../core/services/progress-service';

/** The extra game modes as sticker cards, each one opening a round in that mode. */
@Component({
  selector: 'app-mode-picker',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="modes-title" class="flex flex-col gap-3">
      <h2 id="modes-title" class="text-xl text-space-200">Outros modos</h2>
      <!-- A single mode takes the whole row instead of leaving half of it empty. -->
      <ul class="grid gap-3" [class.grid-cols-2]="modes().length > 1">
        @for (mode of modes(); track mode.id; let odd = $odd) {
          <li [class]="odd ? 'rotate-1' : '-rotate-1'">
            <a
              class="sticker flex h-full flex-col gap-1 px-2.5 py-3 text-left transition hover:bg-white active:translate-y-0.5 sm:px-3"
              [routerLink]="link(mode)"
            >
              <span
                class="font-display text-lg leading-tight tracking-wide break-words hyphens-auto max-[359px]:text-base sm:text-xl"
              >
                {{ mode.name }}
              </span>
              <span class="text-sm leading-snug font-bold text-ink-soft">{{ mode.tagline }}</span>
              @if (best(mode); as points) {
                <span class="mt-auto pt-1 text-xs font-extrabold text-candy-600">
                  Recorde: {{ points }} pts
                </span>
              }
            </a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class ModePicker {
  private readonly progress = inject(ProgressService);

  readonly modes = input.required<readonly GameMode[]>();

  protected readonly link = modeLink;

  protected best(mode: GameMode): number {
    return this.progress.bestFor(mode.id);
  }
}
