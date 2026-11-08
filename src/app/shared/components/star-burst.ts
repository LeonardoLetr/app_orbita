import { Component, computed, input } from '@angular/core';

/** Decorative burst of little stars from the center of its container. */
@Component({
  selector: 'app-star-burst',
  host: {
    class: 'pointer-events-none absolute inset-0 grid place-items-center',
    'aria-hidden': 'true',
  },
  template: `
    @for (particle of particles(); track $index) {
      <span
        class="star-particle col-start-1 row-start-1"
        [class]="particle.color"
        [style.--angle]="particle.angle + 'deg'"
        [style.--distance]="particle.distance + 'rem'"
        [style.animation-delay.ms]="delay() + particle.delay"
      ></span>
    }
  `,
})
export class StarBurst {
  readonly count = input(12);
  /** Tailwind background classes, used in turns. */
  readonly colors = input<readonly string[]>(['bg-star-300']);
  /** How far the stars fly, in rem. */
  readonly reach = input(5);
  readonly delay = input(0);

  protected readonly particles = computed(() => {
    const count = this.count();
    const colors = this.colors();
    return Array.from({ length: count }, (_, i) => ({
      angle: (360 / count) * i + (i % 2) * 9,
      distance: this.reach() * (0.7 + (i % 3) * 0.15),
      delay: (i % 4) * 35,
      color: colors[i % colors.length],
    }));
  });
}
