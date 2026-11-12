import { Component, computed, input } from '@angular/core';

const RADIUS = 14.5;
const LENGTH = 2 * Math.PI * RADIUS;

/** Round countdown: a ring that empties and the seconds left in the middle. */
@Component({
  selector: 'app-timer-ring',
  host: {
    class:
      'relative block size-14 shrink-0 transition-[width,height] duration-300 ease-out motion-reduce:transition-none sm:size-16 compact:size-11',
    '[class.is-urgent]': 'urgent()',
    role: 'timer',
    '[attr.aria-label]': '"Tempo restante: " + seconds() + " segundos"',
  },
  styles: `
    @media (prefers-reduced-motion: no-preference) {
      :host(.is-urgent) {
        animation: hurry 480ms ease-in-out infinite alternate;
      }
    }

    @keyframes hurry {
      from {
        scale: 1;
        rotate: -4deg;
      }
      to {
        scale: 1.14;
        rotate: 4deg;
      }
    }
  `,
  template: `
    <svg
      viewBox="0 0 44 44"
      class="size-full -rotate-90 drop-shadow-[0.15rem_0.15rem_0_var(--color-ink)]"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="20" class="fill-cream stroke-ink" stroke-width="3" />
      <circle
        cx="22"
        cy="22"
        [attr.r]="radius"
        class="fill-none stroke-space-200"
        stroke-width="4.5"
      />
      <circle
        cx="22"
        cy="22"
        fill="none"
        stroke-width="4.5"
        stroke-linecap="round"
        class="progress transition-[stroke-dashoffset] duration-100 ease-linear"
        [class]="urgent() ? 'stroke-flare-500' : 'stroke-candy-500'"
        [attr.r]="radius"
        [attr.stroke-dasharray]="length"
        [attr.stroke-dashoffset]="length * (1 - progress())"
      />
    </svg>
    <span
      class="absolute inset-0 grid place-items-center font-display text-xl text-ink tabular-nums transition-[font-size] duration-300 ease-out motion-reduce:transition-none compact:text-base"
      [class]="urgent() ? 'motion-safe:animate-pulse' : ''"
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
  /** Seconds left from which the ring shows the time as running out. */
  readonly urgentAt = input(5);

  protected readonly radius = RADIUS;
  protected readonly length = LENGTH;
  protected readonly urgent = computed(() => this.seconds() <= this.urgentAt());
}
