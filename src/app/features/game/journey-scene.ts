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
import { PlanetArt } from '../../shared/components/planet-art';

/** Keep in sync with --travel in journey-scene.css. */
export const TRAVEL_MS = 1300;
const SPUTTER_MS = 700;
const ARRIVE_MS = 1400;

/** Planet diameter as a fraction of the scene height. */
const STOP_SIZES: Record<PlanetId, number> = {
  'earth-orbit': 0.3,
  moon: 0.18,
  mars: 0.22,
  jupiter: 0.4,
  saturn: 0.32,
  uranus: 0.28,
  neptune: 0.27,
  pluto: 0.15,
};

const STOPS = PLANETS.map((planet) => ({
  id: planet.id,
  name: planet.name,
  size: STOP_SIZES[planet.id],
}));

const GAIN_TONES: Record<number, string> = {
  10: 'text-satellite',
  20: 'text-comet',
  30: 'text-supernova',
};

/**
 * Where the rocket is on the route, measured in stops: 0 is Earth orbit, 1 the Moon,
 * 1.5 halfway to Mars, and so on. Slightly past Pluto at the maximum score.
 */
export function routePosition(points: number): number {
  const last = PLANETS.length - 1;
  for (let i = 0; i < last; i++) {
    const from = PLANETS[i].minPoints;
    const to = PLANETS[i + 1].minPoints;
    if (points < to) {
      return i + Math.max(0, points - from) / (to - from);
    }
  }
  const lastGap = PLANETS[last].minPoints - PLANETS[last - 1].minPoints;
  return Math.min(last + (points - PLANETS[last].minPoints) / lastGap, last + 0.5);
}

function reachedIndex(points: number): number {
  return PLANETS.filter((planet) => points >= planet.minPoints).length - 1;
}

interface GainEvent {
  key: number;
  gain: number;
  tone: string;
}

/**
 * Decorative journey shown while playing. After each answer the rocket flies
 * forward by the points earned, or sputters in place when nothing was scored.
 */
@Component({
  selector: 'app-journey-scene',
  imports: [PlanetArt],
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
  protected readonly traveling = signal(false);
  protected readonly sputtering = signal(false);
  /** Planets already visited light up when the rocket gets there. */
  protected readonly litIndex = signal(0);
  protected readonly arrivingIndex = signal(-1);
  protected readonly gainEvents = signal<GainEvent[]>([]);

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
    const gain = points - this.seenPoints;
    this.seenAnswers = answers;
    this.seenPoints = points;

    if (!isNewAnswer) {
      this.litIndex.set(reachedIndex(points));
      return;
    }
    if (gain <= 0) {
      this.flag(this.sputtering, 'sputter', SPUTTER_MS);
      return;
    }

    this.flag(this.traveling, 'travel', TRAVEL_MS);
    this.gainEvents.set([{ key: answers, gain, tone: GAIN_TONES[gain] ?? 'text-star-300' }]);

    const reached = reachedIndex(points);
    if (reached > this.litIndex()) {
      this.later('arrive', TRAVEL_MS * 0.85, () => {
        this.litIndex.set(reached);
        this.arrivingIndex.set(reached);
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
