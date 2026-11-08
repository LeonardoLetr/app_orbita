import { Component, computed, input } from '@angular/core';
import { PLANETS } from '../../core/data/planets';
import { PlanetId } from '../../core/models/planet';
import { PlanetArt } from '../../shared/components/planet-art';
import { RocketArt } from '../../shared/components/rocket-art';

/** Keep in sync with --animate-travel in styles.css. */
const TRAVEL_MS = 2200;

const STOPS = PLANETS.map((planet, index) => ({
  id: planet.id,
  percent: (index / (PLANETS.length - 1)) * 100,
}));

/** Decorative map of the journey: the ship flies from Earth to the planet reached. */
@Component({
  selector: 'app-journey-track',
  imports: [PlanetArt, RocketArt],
  template: `
    <div class="relative mx-4 h-20" aria-hidden="true">
      <div class="absolute inset-x-0 top-13 border-t-2 border-dashed border-space-600"></div>
      <div
        class="absolute top-13 left-0 h-0.5 -translate-y-px bg-star-400 motion-safe:animate-trail"
        [style.width.%]="shipPercent()"
      ></div>

      @for (stop of stops; track stop.id; let i = $index) {
        <app-planet-art
          class="absolute top-13 size-[clamp(1.5rem,8.5vw,2.5rem)] -translate-x-1/2 -translate-y-1/2"
          [class]="i <= reachedIndex() ? 'motion-safe:animate-light-up' : 'opacity-35 grayscale'"
          [style.left.%]="stop.percent"
          [style.animation-delay.ms]="lightUpDelay(i)"
          [planet]="stop.id"
        />
      }

      <app-rocket-art
        class="absolute top-0 w-11 -translate-x-1/2 motion-safe:animate-travel"
        [style.left.%]="shipPercent()"
        [boosting]="true"
      />
    </div>
  `,
})
export class JourneyTrack {
  readonly reached = input.required<PlanetId>();

  protected readonly stops = STOPS;
  protected readonly reachedIndex = computed(() =>
    STOPS.findIndex((stop) => stop.id === this.reached()),
  );
  protected readonly shipPercent = computed(() => STOPS[this.reachedIndex()]?.percent ?? 0);

  /** Light each stop up roughly when the ship passes it. */
  protected lightUpDelay(index: number): number {
    const reached = this.reachedIndex();
    return reached > 0 ? Math.round((TRAVEL_MS * index) / reached) - 150 : 0;
  }
}
