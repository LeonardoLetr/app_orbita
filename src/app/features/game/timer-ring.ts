import { Component, computed, input } from '@angular/core';

const RADIUS = 19;
const LENGTH = 2 * Math.PI * RADIUS;

/** Round countdown: a ring that empties and the seconds left in the middle. */
@Component({
  selector: 'app-timer-ring',
  host: {
    class: 'relative block size-14 shrink-0 sm:size-16 short:size-11',
    role: 'timer',
    '[attr.aria-label]': '"Tempo restante: " + seconds() + " segundos"',
  },
  template: `
    <svg viewBox="0 0 44 44" class="size-full -rotate-90" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        [attr.r]="radius"
        class="fill-space-900/85 stroke-space-700"
        stroke-width="4"
      />
      <circle
        cx="22"
        cy="22"
        fill="none"
        stroke-width="4"
        stroke-linecap="round"
        class="transition-[stroke-dashoffset] duration-100 ease-linear"
        [class]="urgent() ? 'stroke-flare-500' : 'stroke-aurora-400'"
        [attr.r]="radius"
        [attr.stroke-dasharray]="length"
        [attr.stroke-dashoffset]="length * (1 - progress())"
      />
    </svg>
    <span
      class="absolute inset-0 grid place-items-center font-display text-lg font-bold tabular-nums short:text-base"
      [class]="urgent() ? 'text-flare-400 motion-safe:animate-pulse' : ''"
      aria-hidden="true"
    >
      {{ seconds() }}
    </span>
  `,
})
export class TimerRing {
  readonly seconds = input.required<number>();
  /** Fraction of time left, from 1 down to 0. */
  readonly progress = input.required<number>();

  protected readonly radius = RADIUS;
  protected readonly length = LENGTH;
  protected readonly urgent = computed(() => this.seconds() <= 5);
}
