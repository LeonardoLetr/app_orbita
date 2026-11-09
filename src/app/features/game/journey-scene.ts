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

/**
 * How each planet passes the rocket: body diameter and how much of it shows from its
 * side of the screen, in scene units (a phone screen is about 100 units wide). They are
 * far bigger than the rocket and mostly off screen, to show how huge planets are.
 */
const STOP_LOOKS: Record<RouteStop, { size: number; visible: number; side: 'left' | 'right' }> = {
  moon: { size: 70, visible: 32, side: 'left' },
  mars: { size: 85, visible: 34, side: 'right' },
  jupiter: { size: 170, visible: 40, side: 'left' },
  saturn: { size: 90, visible: 34, side: 'right' },
  uranus: { size: 120, visible: 38, side: 'left' },
  neptune: { size: 115, visible: 38, side: 'right' },
  pluto: { size: 55, visible: 28, side: 'left' },
};

/** Planet drawing width for a given body diameter (the body fills part of the drawing). */
const ART_SCALE: Partial<Record<RouteStop, number>> = { saturn: 2 };

const STOPS = PLANETS.map((planet, index) => ({ planet, index }))
  .filter(({ planet }) => planet.id !== 'earth-orbit')
  .map(({ planet, index }) => ({
    id: planet.id,
    index,
    name: planet.name,
    distance: formatDistance(planet.distanceKm),
    art: ART_SCALE[planet.id as RouteStop] ?? 1.765,
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
