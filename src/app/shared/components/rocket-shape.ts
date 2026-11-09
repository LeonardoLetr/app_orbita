import { Component, input } from '@angular/core';

/**
 * The rocket drawing as an SVG group, facing right in a 64 by 36 box, so it can be
 * placed inside other drawings (for example flying along a path). Decorative only.
 */
@Component({
  selector: 'g[appRocketShape]',
  template: `
    <svg:g class="flame" [class.is-boosting]="boosting()">
      <svg:path d="M15 18C9 11 3 13 0 18c3 5 9 7 15 0z" class="fill-flare-500" />
      <svg:path d="M15 18c-4-3.5-8-3-10 0 2 3 6 3.5 10 0z" class="flame-core fill-star-300" />
    </svg:g>
    <svg:path d="M21 10 15 2h9l8 8zm0 16-6 8h9l8-8z" class="fill-nebula-500" />
    <svg:path
      d="M13 18c0-5 4-8 9-8h19c9 0 16 4 22 8-6 4-13 8-22 8H22c-5 0-9-3-9-8z"
      class="fill-space-50"
    />
    <svg:path d="M47 11.5h3v13h-3z" class="fill-flare-400" />
    <!-- The flag stays upright whichever way the rocket points. -->
    <svg:g [attr.transform]="upright() ? 'rotate(90 26 18)' : null">
      <svg:rect x="21.5" y="14.5" width="9" height="7" rx="0.6" fill="#1f9d55" />
      <svg:path d="M26 15.3 29.6 18 26 20.7 22.4 18z" fill="#ffd23f" />
      <svg:circle cx="26" cy="18" r="1.6" fill="#1d4fa8" />
    </svg:g>
    <svg:circle
      cx="38"
      cy="18"
      r="4.3"
      class="fill-aurora-400 stroke-space-700"
      stroke-width="1.5"
    />
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
  /** Keep the flag readable when the drawing is turned to point up. */
  readonly upright = input(false);
}
