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
import { formatDistance, reachedIndex } from '../../core/utils/journey';
import { PlanetArt } from '../../shared/components/planet-art';
import { RocketArt } from '../../shared/components/rocket-art';
import { ExhaustPlume } from './exhaust-plume';
import { FLY_EASING, LIFTOFF_EASING } from './flight-motion';
import { flightPath } from './flight-path';
import { LIFTOFF_MS, LaunchLayers } from './launch-layers';
import { StarField } from './star-field';

const SPUTTER_MS = 700;
/** How long the banner of a stop just passed stays on screen. */
const ARRIVE_MS = 1900;
/**
 * The route is a map that stands still: every stop sits at the points it takes to reach
 * it, and the rocket travels over the map. This many points fill one stretch of it, and
 * a stretch is this many screens tall (as in the CSS): the Moon is two thirds of a
 * stretch from the Earth, Pluto two whole stretches past Neptune, with nothing but stars
 * on most of the way.
 */
const STRETCH_POINTS = 60;
const STRETCH_SCREENS = 1.5;
/**
 * Shortest and longest flight and what each stretch on the way adds, in milliseconds.
 * Quick rounds keep every flight short.
 */
const FLIGHTS: Record<RoundPace, { min: number; max: number; perStretch: number }> = {
  calm: { min: 1000, max: 3800, perStretch: 1100 },
  quick: { min: 500, max: 1200, perStretch: 500 },
};
/** The climb off the Earth, after the countdown. */
const LAUNCH_CLIMB_MS = 2600;
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
): number {
  const stretches = (toPoints - fromPoints) / STRETCH_POINTS;
  if (stretches <= 0) {
    return 0;
  }
  const { min, max, perStretch } = FLIGHTS[pace];
  return Math.round(Math.min(max, min + perStretch * Math.sqrt(stretches)));
}

/**
 * Things adrift in the long empty stretches of the map, so there is something to fly
 * past between two far planets. They sit at the same heights for a route, as part of the
 * map, but move on their own: comets cross the screen, rocks tumble and sway.
 */
function debrisOf(route: Route) {
  const items: {
    at: number;
    x: number;
    size: number;
    kind: 'asteroid' | 'comet';
    turn: number;
    /** How long one crossing (comet) or one turn (rock) lasts, in seconds. */
    period: number;
    /** Where in that cycle it starts, so no two move in step. */
    phase: number;
  }[] = [];
  for (let i = 1; i < route.length; i++) {
    const from = route[i - 1].minPoints;
    const to = route[i].minPoints;
    // Clear of the planets at both ends.
    for (let at = from + 28; at <= to - 24; at += 22) {
      // A fixed scramble of the position: no two alike, yet the same every round.
      const seed = Math.abs(Math.sin(at * 12.9898) * 43758.5453) % 1;
      const other = Math.abs(Math.sin(at * 78.233) * 12543.123) % 1;
      items.push({
        at: at + Math.round(seed * 10),
        x: 8 + Math.round(other * 84),
        size: 3 + Math.round(seed * 5),
        kind: other > 0.72 ? 'comet' : 'asteroid',
        turn: Math.round(seed * 360),
        period: other > 0.72 ? 7 + Math.round(seed * 6) : 16 + Math.round(other * 20),
        phase: Math.round(other * 100) / 100,
      });
    }
  }
  return items;
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
      /** Where it sits on the map: the points it takes to reach it. */
      at: planet.minPoints,
      name: planet.name,
      distance: formatDistance(planet.distanceKm),
      ...STOP_LOOKS[planet.id as RouteStop],
    }));
}

/**
 * The journey seen from behind the rocket, used as the game background. The planets
 * stand still on the map; after each answer the rocket flies over it by the points
 * earned, leaving behind what it passes, or sputters in place when nothing was scored.
 * Between answers nothing on the map moves: only the stars drift by.
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
  protected readonly debris = computed(() => debrisOf(this.route()));
  protected readonly flying = signal(false);
  protected readonly sputtering = signal(false);
  /** Planets light up as the rocket passes them. */
  protected readonly litIndex = signal(0);
  protected readonly arrivingIndex = signal(-1);
  /** The stop just passed, named on a banner for a moment. */
  protected readonly arrival = computed(() =>
    this.stops().find((stop) => stop.index === this.arrivingIndex()),
  );

  private readonly sound = inject(SoundService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly starField = viewChild(StarField);
  protected readonly exhaust = viewChild(ExhaustPlume);
  private readonly rocketTilt = viewChild<ElementRef<HTMLElement>>('rocketTilt');
  private readonly scene = viewChild<ElementRef<HTMLElement>>('scene');
  private frame = 0;
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
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((timer) => clearTimeout(timer));
      this.cancelFlight();
    });
  }

  private react(answers: number, points: number): void {
    const isNewAnswer = answers > this.seenAnswers;
    const from = this.seenPoints;
    this.seenAnswers = answers;
    this.seenPoints = points;

    const route = this.route();
    if (!isNewAnswer) {
      this.cancelFlight();
      this.showPosition(points);
      this.litIndex.set(reachedIndex(points, route));
      return;
    }
    if (points <= from) {
      this.flag(this.sputtering, 'sputter', SPUTTER_MS);
      this.exhaust()?.sputter();
      return;
    }

    const path = flightPath(from, points, flightDuration(from, points, this.pace()), FLY_EASING);
    const duration = path.duration;
    this.flag(this.flying, 'fly', duration);
    this.sound.play('thrust', duration / 1000);
    const distance = ((points - from) / STRETCH_POINTS) * STRETCH_SCREENS * this.screenPx();
    this.starField()?.fly(duration, distance);
    this.exhaust()?.fly(duration, distance);
    this.follow(path, points);

    // Each planet lights up, and is named on a banner, as the rocket goes past it.
    for (let index = this.litIndex() + 1; index <= reachedIndex(points, route); index++) {
      this.later(`arrive-${index}`, path.passes(route[index].minPoints), () => {
        this.litIndex.set(Math.max(this.litIndex(), index));
        this.arrivingIndex.set(index);
        this.sound.play('arrive');
        this.later('arrived', ARRIVE_MS, () => this.arrivingIndex.set(-1));
      });
    }
  }

  /** Moves the map under the rocket along a flight, frame by frame. */
  private follow(path: { duration: number; at(ms: number): number }, end: number): void {
    this.cancelFlight();
    const still = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof requestAnimationFrame !== 'function') {
      this.showPosition(end);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const ms = now - start;
      if (ms >= path.duration) {
        this.frame = 0;
        this.showPosition(end);
        return;
      }
      this.showPosition(path.at(ms));
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private cancelFlight(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  /** Where the rocket is on the map, in points. */
  private showPosition(points: number): void {
    this.scene()?.nativeElement.style.setProperty('--pos', `${Math.round(points * 100) / 100}`);
  }

  /** Height of the scene in pixels: the screen the map is measured in. */
  private screenPx(): number {
    return this.host.nativeElement.offsetHeight;
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
