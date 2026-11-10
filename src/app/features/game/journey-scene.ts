import {
  Component,
  DestroyRef,
  ElementRef,
  WritableSignal,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { PLANETS } from '../../core/data/planets';
import { PlanetId, Route } from '../../core/models/planet';
import { RoundPace } from '../../core/models/round-rules';
import { SoundService } from '../../core/services/sound-service';
import { formatDistance, reachedIndex, routePosition } from '../../core/utils/journey';
import { PlanetArt } from '../../shared/components/planet-art';
import { RocketArt } from '../../shared/components/rocket-art';
import { ExhaustPlume } from './exhaust-plume';
import { LIFTOFF_EASING } from './flight-motion';
import { LIFTOFF_MS, LaunchLayers } from './launch-layers';
import { StarField } from './star-field';

const SPUTTER_MS = 700;
const ARRIVE_MS = 1400;
/**
 * Shortest and longest flight and what each stop on the way adds, in milliseconds.
 * Quick rounds keep every flight short.
 */
const FLIGHTS: Record<RoundPace, { min: number; max: number; perStop: number }> = {
  calm: { min: 1300, max: 6000, perStop: 1800 },
  quick: { min: 500, max: 1200, perStop: 500 },
};
/** The climb off the Earth, after the countdown. */
const LAUNCH_CLIMB_MS = 2600;
/** Distance between two stops, in scene units (the --gap of the CSS). */
const GAP_UNITS = 140;
/** How far the Earth drops away at launch, in scene units (as in the CSS). */
const LIFTOFF_UNITS = 40.5;
/** Width of the rocket in scene units (as in the CSS), used to measure a unit in pixels. */
const ROCKET_UNITS = 10.5;

/**
 * How long the rocket flies between two scores: longer trips take longer,
 * but never so long that the round drags.
 */
export function flightDuration(
  fromPoints: number,
  toPoints: number,
  pace: RoundPace = 'calm',
  route: Route = PLANETS,
): number {
  const stops = routePosition(toPoints, route) - routePosition(fromPoints, route);
  if (stops <= 0) {
    return 0;
  }
  const { min, max, perStop } = FLIGHTS[pace];
  return Math.round(Math.min(max, min + perStop * Math.sqrt(stops)));
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
  eris: { size: 18, side: 'right' },
  heliopause: { size: 44, side: 'left' },
  voyager: { size: 14, side: 'right' },
  'oort-cloud': { size: 44, side: 'left' },
  proxima: { size: 34, side: 'right' },
};

/** The stops after the first one (where the rocket starts), with how each is drawn. */
function stopsOf(route: Route) {
  return route
    .map((planet, index) => ({ planet, index }))
    .filter(({ planet }) => planet.id !== 'earth-orbit')
    .map(({ planet, index }) => ({
      id: planet.id,
      index,
      name: planet.name,
      distance: formatDistance(planet.distanceKm),
      ...STOP_LOOKS[planet.id as RouteStop],
    }));
}

/**
 * The journey seen from behind the rocket, used as the game background. After each
 * answer the rocket climbs by the points earned while the planets slide past, or
 * sputters in place when nothing was scored.
 */
@Component({
  selector: 'app-journey-scene',
  imports: [PlanetArt, RocketArt, LaunchLayers, StarField, ExhaustPlume],
  templateUrl: './journey-scene.html',
  styleUrl: './journey-scene.css',
  host: { 'aria-hidden': 'true' },
})
export class JourneyScene {
  /** Points scored so far in the round. */
  readonly points = input.required<number>();
  /** Answers given so far; each new one plays an animation. */
  readonly answers = input.required<number>();
  /** Start of the round: the rocket takes off from the ground. */
  readonly launching = input(false);
  /** Quick rounds have shorter flights. */
  readonly pace = input<RoundPace>('calm');
  /** Stops along the way. */
  readonly route = input<Route>(PLANETS);

  /** The rocket has left the launch pad. */
  protected readonly liftoff = signal(false);

  protected readonly stops = computed(() => stopsOf(this.route()));
  protected readonly position = computed(() => routePosition(this.points(), this.route()));
  protected readonly flying = signal(false);
  protected readonly flightMs = signal(FLIGHTS.calm.min);
  protected readonly sputtering = signal(false);
  /** Planets light up as the rocket passes them. */
  protected readonly litIndex = signal(0);
  protected readonly arrivingIndex = signal(-1);

  private readonly sound = inject(SoundService);
  private readonly starField = viewChild(StarField);
  protected readonly exhaust = viewChild(ExhaustPlume);
  private readonly rocketTilt = viewChild<ElementRef<HTMLElement>>('rocketTilt');
  private seenAnswers = 0;
  private seenPoints = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const answers = this.answers();
      const points = this.points();
      untracked(() => this.react(answers, points));
    });
    effect(() => {
      const launching = this.launching();
      untracked(() => {
        clearTimeout(this.timers.get('liftoff'));
        this.liftoff.set(false);
        if (launching) {
          this.exhaust()?.ignite(LIFTOFF_MS);
          this.later('liftoff', LIFTOFF_MS, () => {
            this.liftoff.set(true);
            const climb = LIFTOFF_UNITS * this.unitPx();
            const duration = LAUNCH_CLIMB_MS;
            this.starField()?.fly(duration, climb, LIFTOFF_EASING);
            this.exhaust()?.fly(duration, climb, LIFTOFF_EASING, true);
          });
        }
      });
    });
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  private react(answers: number, points: number): void {
    const isNewAnswer = answers > this.seenAnswers;
    const from = this.seenPoints;
    this.seenAnswers = answers;
    this.seenPoints = points;

    const route = this.route();
    if (!isNewAnswer) {
      this.litIndex.set(reachedIndex(points, route));
      return;
    }
    if (points <= from) {
      this.flag(this.sputtering, 'sputter', SPUTTER_MS);
      this.exhaust()?.sputter();
      return;
    }

    const duration = flightDuration(from, points, this.pace(), route);
    this.flightMs.set(duration);
    this.flag(this.flying, 'fly', duration);
    this.sound.play('thrust', duration / 1000);
    const distance =
      (routePosition(points, route) - routePosition(from, route)) * GAP_UNITS * this.unitPx();
    this.starField()?.fly(duration, distance);
    this.exhaust()?.fly(duration, distance);

    // Light each planet roughly when the rocket goes past it.
    const start = routePosition(from, route);
    const end = routePosition(points, route);
    for (let index = this.litIndex() + 1; index <= reachedIndex(points, route); index++) {
      const share = (index - start) / (end - start);
      this.later(`arrive-${index}`, duration * Math.min(1, 0.25 + share * 0.7), () => {
        this.litIndex.set(Math.max(this.litIndex(), index));
        this.arrivingIndex.set(index);
        this.sound.play('arrive');
        this.later('arrived', ARRIVE_MS, () => this.arrivingIndex.set(-1));
      });
    }
  }

  /** One scene unit in pixels, measured on the rocket (it is ROCKET_UNITS wide). */
  private unitPx(): number {
    return (this.rocketTilt()?.nativeElement.offsetWidth ?? 0) / ROCKET_UNITS;
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
