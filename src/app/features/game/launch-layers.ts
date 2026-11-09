import { Component } from '@angular/core';

/** When the rocket leaves the launch pad, after the 3-2-1 countdown. */
export const LIFTOFF_MS = 1800;
/** Whole launch, from the pad until the rocket is out in space. */
export const LAUNCH_MS = 4600;

/** Smoke clouds around the launch pad: offset from the rocket and size in scene units. */
const PUFFS = [
  { x: -5, size: 16, delay: 0.7, drift: -40 },
  { x: 5, size: 16, delay: 0.8, drift: 40 },
  { x: -12, size: 20, delay: 1.2, drift: -70 },
  { x: 12, size: 20, delay: 1.3, drift: 70 },
  { x: 0, size: 24, delay: 1.6, drift: 0 },
  { x: -21, size: 20, delay: 1.75, drift: -110 },
  { x: 21, size: 20, delay: 1.8, drift: 110 },
];

const CLOUDS = [
  { x: 6, width: 34, delay: 2.35 },
  { x: 60, width: 40, delay: 2.6 },
  { x: 28, width: 28, delay: 2.95 },
];

/**
 * The start of every round: blue sky, the launch pad on green ground and smoke, which
 * drop away as the rocket climbs through the clouds into space. Lives inside the
 * journey scene, so it shares its sizes; purely decorative.
 */
@Component({
  selector: 'app-launch-layers',
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="sky"></div>
    @for (cloud of clouds; track $index) {
      <svg
        viewBox="0 0 120 50"
        class="cloud"
        [style.--x.%]="cloud.x"
        [style.--w]="cloud.width"
        [style.animation-delay.s]="cloud.delay"
      >
        <circle cx="35" cy="30" r="18" />
        <circle cx="60" cy="22" r="22" />
        <circle cx="85" cy="30" r="16" />
        <rect x="18" y="30" width="84" height="18" rx="9" />
      </svg>
    }
    <div class="ground">
      <span class="hill hill-left"></span>
      <span class="hill hill-right"></span>
      <span class="tower"></span>
      <span class="pad"></span>
      @for (puff of puffs; track $index) {
        <span
          class="smoke"
          [style.--x]="puff.x"
          [style.--s]="puff.size"
          [style.--drift.%]="puff.drift"
          [style.animation-delay.s]="puff.delay"
        ></span>
      }
    </div>
  `,
  styleUrl: './launch-layers.css',
})
export class LaunchLayers {
  protected readonly puffs = PUFFS;
  protected readonly clouds = CLOUDS;
}
