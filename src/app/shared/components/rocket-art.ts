import { Component, input } from '@angular/core';
import { RocketShape } from './rocket-shape';

/**
 * The game's rocket, with a small Brazilian flag. Drawn facing right; `upright`
 * turns it to point up inside a tall box. Decorative only.
 */
@Component({
  selector: 'app-rocket-art',
  imports: [RocketShape],
  host: {
    'aria-hidden': 'true',
    '[class]': "upright() ? 'relative block aspect-[36/64]' : 'block'",
  },
  template: `
    <svg
      viewBox="0 0 64 36"
      class="block h-auto overflow-visible"
      [class]="
        upright()
          ? 'absolute top-1/2 left-1/2 w-[177.78%] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90'
          : 'w-full'
      "
    >
      <g appRocketShape [boosting]="boosting()" [upright]="upright()"></g>
    </svg>
  `,
})
export class RocketArt {
  /** Bigger flame, while the rocket speeds up. */
  readonly boosting = input(false);
  /** Point up instead of right. */
  readonly upright = input(false);
}
