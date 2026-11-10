import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { THEMED_MODES, THEME_MODE, modeLink } from '../../core/data/game-modes';
import { ProgressService } from '../../core/services/progress-service';

/** Where the player picks the theme of a round: one sticker card for each theme. */
@Component({
  selector: 'app-theme-page',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-4 sm:px-5 sm:py-10">
      <header>
        <a
          routerLink="/"
          class="-ml-3 inline-flex min-h-11 items-center rounded-full px-3 font-semibold text-space-200 underline-offset-4 hover:text-space-50 hover:underline"
        >
          ← Início
        </a>
      </header>

      <div class="flex flex-col gap-2">
        <h1 class="title-3d -rotate-1 self-start text-5xl sm:text-6xl">Escolha um tema</h1>
        <p class="text-lg font-bold text-space-200">
          São 7 categorias, 30 segundos para cada uma, todas do tema escolhido.
          @if (best) {
            Seu recorde por tema: <strong class="text-star-400">{{ best }} pts</strong>.
          }
        </p>
      </div>

      <ul class="grid gap-4 sm:grid-cols-2">
        @for (mode of modes; track mode.theme!.id; let odd = $odd) {
          <li [class]="odd ? 'rotate-1' : '-rotate-1'">
            <a
              class="sticker flex h-full flex-col overflow-hidden transition hover:bg-white active:translate-y-0.5"
              [routerLink]="link(mode)"
            >
              <span class="h-3 border-b-[3px] border-ink" [class]="mode.theme!.tone"></span>
              <span class="flex flex-col gap-1 px-4 py-3 text-left">
                <span class="font-display text-2xl leading-tight tracking-wide">
                  {{ mode.theme!.name }}
                </span>
                <span class="leading-snug font-bold text-ink-soft">{{ mode.theme!.tagline }}</span>
              </span>
            </a>
          </li>
        }
      </ul>
    </main>
  `,
})
export class ThemePage {
  protected readonly modes = THEMED_MODES;
  protected readonly link = modeLink;
  protected readonly best = inject(ProgressService).bestFor(THEME_MODE.id);
}
