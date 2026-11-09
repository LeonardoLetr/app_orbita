import { Component } from '@angular/core';

/** When the rocket leaves the launch pad, after the 3-2-1 countdown. */
export const LIFTOFF_MS = 1800;
/** Whole launch, from the pad until the rocket is out in space. */
export const LAUNCH_MS = 4600;

/** Smoke clouds around the launch pad: offset from the rocket and size in scene units. */
const PUFFS = [
  { x: -5, size: 12, delay: 0.7, drift: -45 },
  { x: 5, size: 12, delay: 0.8, drift: 45 },
  { x: -11, size: 15, delay: 1.2, drift: -80 },
  { x: 11, size: 15, delay: 1.3, drift: 80 },
  { x: 0, size: 17, delay: 1.6, drift: 0 },
  { x: -18, size: 14, delay: 1.75, drift: -120 },
  { x: 18, size: 14, delay: 1.8, drift: 120 },
];

/**
 * Launch pad and smoke on top of the Earth at the start of every round. They stay on the
 * planet, falling away with it as the rocket climbs. Lives inside the journey scene, so it
 * shares its sizes; purely decorative.
 */
@Component({
  selector: 'app-launch-layers',
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="base">
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
}
