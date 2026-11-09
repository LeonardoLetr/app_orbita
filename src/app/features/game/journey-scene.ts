import {
  Component,
  DestroyRef,
  WritableSignal,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { PLANETS } from '../../core/data/planets';
import { PlanetId } from '../../core/models/planet';
import { SoundService } from '../../core/services/sound-service';
import { formatDistance, reachedIndex, routePosition } from '../../core/utils/journey';
import { PlanetArt } from '../../shared/components/planet-art';
import { RocketArt } from '../../shared/components/rocket-art';

const SPUTTER_MS = 700;
const ARRIVE_MS = 1400;
const MIN_FLIGHT_MS = 900;
const MAX_FLIGHT_MS = 4200;

/**
 * How long the rocket flies between two scores: longer trips take longer,
 * but never so long that the round drags.
 */
export function flightDuration(fromPoints: number, toPoints: number): number {
  const stops = routePosition(toPoints) - routePosition(fromPoints);
  if (stops <= 0) {
    return 0;
  }
  return Math.round(Math.min(MAX_FLIGHT_MS, MIN_FLIGHT_MS + 1300 * Math.sqrt(stops)));
}

type RouteStop = Exclude<PlanetId, 'earth-orbit'>;

/** Planet diameter, in scene units, and the side of the route it passes on. */
const STOP_LOOKS: Record<RouteStop, { size: number; side: 'left' | 'right' }> = {
  moon: { size: 22, side: 'left' },
  mars: { size: 26, side: 'right' },
  jupiter: { size: 46, side: 'left' },
  saturn: { size: 38, side: 'right' },
  uranus: { size: 32, side: 'left' },
  neptune: { size: 32, side: 'right' },
  pluto: { size: 18, side: 'left' },
};

const STOPS = PLANETS.map((planet, index) => ({ planet, index }))
  .filter(({ planet }) => planet.id !== 'earth-orbit')
  .map(({ planet, index }) => ({
    id: planet.id,
    index,
    name: planet.name,
    distance: formatDistance(planet.distanceKm),
    ...STOP_LOOKS[planet.id as RouteStop],
  }));

/**
 * The journey seen from behind the rocket, used as the game background. After each
 * answer the rocket climbs by the points earned while the planets slide past, or
 * sputters in place when nothing was scored.
 */
@Component({
  selector: 'app-journey-scene',
  imports: [PlanetArt, RocketArt],
  templateUrl: './journey-scene.html',
  styleUrl: './journey-scene.css',
  host: { 'aria-hidden': 'true' },
})
export class JourneyScene {
  /** Points scored so far in the round. */
  readonly points = input.required<number>();
  /** Answers given so far; each new one plays an animation. */
  readonly answers = input.required<number>();

  protected readonly stops = STOPS;
  protected readonly position = computed(() => routePosition(this.points()));
  protected readonly flying = signal(false);
  protected readonly flightMs = signal(MIN_FLIGHT_MS);
  protected readonly sputtering = signal(false);
  /** Planets light up as the rocket passes them. */
  protected readonly litIndex = signal(0);
  protected readonly arrivingIndex = signal(-1);

  private readonly sound = inject(SoundService);
  private seenAnswers = 0;
  private seenPoints = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const answers = this.answers();
      const points = this.points();
      untracked(() => this.react(answers, points));
    });
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  private react(answers: number, points: number): void {
    const isNewAnswer = answers > this.seenAnswers;
    const from = this.seenPoints;
    this.seenAnswers = answers;
    this.seenPoints = points;

    if (!isNewAnswer) {
      this.litIndex.set(reachedIndex(points));
      return;
    }
    if (points <= from) {
      this.flag(this.sputtering, 'sputter', SPUTTER_MS);
      return;
    }

    const duration = flightDuration(from, points);
    this.flightMs.set(duration);
    this.flag(this.flying, 'fly', duration);
    this.sound.play('thrust', duration / 1000);

    // Light each planet roughly when the rocket goes past it.
    const start = routePosition(from);
    const end = routePosition(points);
    for (let index = this.litIndex() + 1; index <= reachedIndex(points); index++) {
      const share = (index - start) / (end - start);
      this.later(`arrive-${index}`, duration * Math.min(1, 0.25 + share * 0.7), () => {
        this.litIndex.set(Math.max(this.litIndex(), index));
        this.arrivingIndex.set(index);
        this.sound.play('arrive');
        this.later('arrived', ARRIVE_MS, () => this.arrivingIndex.set(-1));
      });
    }
  }

  private flag(state: WritableSignal<boolean>, key: string, ms: number): void {
    state.set(true);
    this.later(key, ms, () => state.set(false));
  }

  private later(key: string, ms: number, action: () => void): void {
    clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(action, ms));
  }
}
