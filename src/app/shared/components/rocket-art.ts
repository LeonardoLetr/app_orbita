import { Component, input } from '@angular/core';

/** The game's rocket, facing right. Decorative only. */
@Component({
  selector: 'app-rocket-art',
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 64 36" class="block h-auto w-full overflow-visible">
      <g class="flame" [class.is-boosting]="boosting()">
        <path d="M15 18C9 11 3 13 0 18c3 5 9 7 15 0z" class="fill-flare-500" />
        <path d="M15 18c-4-3.5-8-3-10 0 2 3 6 3.5 10 0z" class="fill-star-300" />
      </g>
      <path d="M21 10 15 2h9l8 8zm0 16-6 8h9l8-8z" class="fill-nebula-500" />
      <path
        d="M13 18c0-5 4-8 9-8h19c9 0 16 4 22 8-6 4-13 8-22 8H22c-5 0-9-3-9-8z"
        class="fill-space-50"
      />
      <path d="M47 11.5h3v13h-3z" class="fill-flare-400" />
      <circle cx="37" cy="18" r="4.3" class="fill-aurora-400 stroke-space-700" stroke-width="1.5" />
    </svg>
  `,
  styles: `
    .flame {
      transform-origin: 15px 18px;
      transition: transform 250ms ease-out;
    }

    .flame.is-boosting {
      transform: scale(2.3, 1.35);
    }

    @media (prefers-reduced-motion: no-preference) {
      .flame {
        animation: flicker 160ms steps(2) infinite alternate;
      }
    }

    @keyframes flicker {
      to {
        opacity: 0.75;
      }
    }
  `,
})
export class RocketArt {
  /** Bigger flame, while the rocket speeds up. */
  readonly boosting = input(false);
}
