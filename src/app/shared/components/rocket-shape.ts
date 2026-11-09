import { Component, input } from '@angular/core';

/**
 * The rocket drawing as an SVG group, facing right in a 64 by 36 box, so it can be
 * placed inside other drawings (for example flying along a path). Decorative only.
 */
@Component({
  selector: 'g[appRocketShape]',
  template: `
    @if (flame()) {
      <svg:g class="flame" [class.is-boosting]="boosting()">
        <svg:path d="M15 18C9 11 3 13 0 18c3 5 9 7 15 0z" class="fill-flare-500" />
        <svg:path d="M15 18c-4-3.5-8-3-10 0 2 3 6 3.5 10 0z" class="flame-core fill-star-300" />
      </svg:g>
    }
    <svg:path
      d="M21 10 15 2h9l8 8zm0 16-6 8h9l8-8z"
      class="fill-nebula-500 stroke-ink"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
    <svg:path
      d="M13 18c0-5 4-8 9-8h19c9 0 16 4 22 8-6 4-13 8-22 8H22c-5 0-9-3-9-8z"
      class="fill-space-50 stroke-ink"
      stroke-width="1.6"
    />
    <svg:path d="M47 11.6h3v12.8h-3z" class="fill-candy-500" />
    <svg:circle cx="36" cy="18" r="4.6" class="fill-aurora-400 stroke-ink" stroke-width="1.6" />
    <svg:circle cx="34.6" cy="16.6" r="1.3" class="fill-white" opacity="0.8" />
  `,
  styles: `
    .flame,
    .flame-core {
      transform-origin: 15px 18px;
    }

    .flame {
      transition: transform 250ms ease-out;
    }

    .flame.is-boosting {
      transform: scale(2.3, 1.35);
    }

    /* scale (not transform) so the flicker adds up with the boost above. */
    @media (prefers-reduced-motion: no-preference) {
      .flame {
        animation: flicker 220ms ease-in-out infinite alternate;
      }

      .flame-core {
        animation: flicker-core 150ms ease-in-out infinite alternate;
      }
    }

    @keyframes flicker {
      from {
        scale: 1 1;
      }
      50% {
        scale: 1.2 0.9;
        opacity: 0.9;
      }
      to {
        scale: 0.85 1.08;
        opacity: 0.8;
      }
    }

    @keyframes flicker-core {
      to {
        scale: 1.3 0.85;
        opacity: 0.85;
      }
    }
  `,
})
export class RocketShape {
  /** Bigger flame, while the rocket speeds up. */
  readonly boosting = input(false);
  /** Draw the flame; off when an animated flame is drawn behind the rocket instead. */
  readonly flame = input(true);
}
