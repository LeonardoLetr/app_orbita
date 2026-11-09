import {
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CLASSIC_MODE } from '../../core/data/game-modes';
import { GameMode } from '../../core/models/game-mode';
import { GameService } from '../../core/services/game-service';
import { MusicService } from '../../core/services/music-service';
import { ScoringService } from '../../core/services/scoring-service';
import { SoundService } from '../../core/services/sound-service';
import { FitVisualViewport } from '../../shared/fit-visual-viewport';
import { distanceAt, formatDistance } from '../../core/utils/journey';
import { RARITY_LABELS } from '../../shared/components/rarity-badge';
import { Result } from '../result/result';
import { Countdown } from './countdown';
import { JourneyScene, flightDuration } from './journey-scene';
import { LAUNCH_MS, LIFTOFF_MS } from './launch-layers';
import { QuestionCard } from './question-card';
import { TimerRing } from './timer-ring';

/** Shortest time an answer's result stays on screen. */
export const MIN_REVEAL_MS = 1500;

/** Time to show an answer's result: the whole flight plus a moment to read it. */
export function revealDelay(pointsBefore: number, pointsAfter: number): number {
  return Math.max(MIN_REVEAL_MS, flightDuration(pointsBefore, pointsAfter) + 700);
}

/**
 * Whether each round starts with the launch from the ground. Off for players who ask
 * for less motion, who go straight to the first category.
 */
export const SHOW_LAUNCH = new InjectionToken<boolean>('SHOW_LAUNCH', {
  providedIn: 'root',
  factory: () => !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
});

/** Countdown beats before liftoff, in milliseconds from the start of the launch. */
const COUNTDOWN_BEATS = [0, 600, 1200];

/** Friendly nudges when an answer is not in the base, used in turns. */
const RETRY_MESSAGES = [
  'Essa não está na lista. Tente outra!',
  'Quase! Tente outra palavra.',
  'Hmm, essa não vale. Tenta de novo!',
];

const ZERO_ANNOUNCEMENTS = {
  unknown: 'Fora da base, nenhum ponto.',
  blank: 'Categoria pulada.',
  timeout: 'Tempo esgotado.',
};

@Component({
  selector: 'app-game',
  imports: [
    RouterLink,
    NgTemplateOutlet,
    Result,
    JourneyScene,
    QuestionCard,
    TimerRing,
    FitVisualViewport,
  ],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  protected readonly game = inject(GameService);
  protected readonly sound = inject(SoundService);
  protected readonly music = inject(MusicService);
  private readonly scoring = inject(ScoringService);
  protected readonly countdown = new Countdown();
  protected readonly draft = signal('');
  /** Message shown after an answer outside the base, while the player can try again. */
  protected readonly retryMessage = signal('');

  protected readonly answered = computed(
    () => this.game.entries().filter((entry) => entry.result).length,
  );
  protected readonly next = computed(() => this.scoring.nextDestination(this.game.totalPoints()));
  /** Next destination with the points still missing, for the question card. */
  protected readonly nextGoal = computed(() => {
    const next = this.next();
    return next
      ? { name: next.name, missing: next.minPoints - this.game.totalPoints() }
      : undefined;
  });
  /** Distance travelled with the answer being revealed. */
  protected readonly revealKm = signal<string | undefined>(undefined);

  /** Spoken to screen reader users when time is about to run out. */
  protected readonly timeWarning = computed(() => {
    const seconds = this.countdown.seconds();
    const counting = this.game.status() === 'playing' && this.game.timerEnabled();
    return counting && (seconds === 10 || seconds === 5) ? `Faltam ${seconds} segundos` : '';
  });

  /** Spoken result of the answer, since the rocket scene is decorative. */
  protected readonly resultAnnouncement = computed(() => {
    const result = this.game.status() === 'revealing' ? this.game.current()?.result : undefined;
    if (!result) {
      return '';
    }
    if (!result.match) {
      return ZERO_ANNOUNCEMENTS[result.outcome as keyof typeof ZERO_ANNOUNCEMENTS];
    }
    const counted =
      result.match.text.toLowerCase() !== result.input.toLowerCase()
        ? ` Valeu como ${result.match.text}.`
        : '';
    return `${RARITY_LABELS[result.match.rarity]}, mais ${result.points} pontos.${counted}`;
  });

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');
  private readonly score = viewChild<ElementRef<HTMLElement>>('score');
  private revealTimer?: ReturnType<typeof setTimeout>;
  private retries = 0;
  private readonly showLaunch = inject(SHOW_LAUNCH);
  /** Each mode has its own address, which says how this screen plays. */
  private readonly mode: GameMode = inject(ActivatedRoute).snapshot.data['mode'] ?? CLASSIC_MODE;
  private launchTimers: ReturnType<typeof setTimeout>[] = [];
  private endLaunch?: () => void;

  /** The rocket is taking off; the first category comes right after. */
  protected readonly launching = signal(false);
  /** Whether the answer field has the keyboard, to invite a tap when it does not. */
  protected readonly fieldFocused = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopTimers();
      this.music.stop();
    });

    // Background music plays during the game screen, following its switch.
    effect(() => (this.music.enabled() ? this.music.start() : this.music.stop()));

    // Keep the keyboard on the answer field whenever a new category shows up. Without
    // scrolling: right after the launch the bar is still sliding in from below the screen,
    // and scrolling to it would push the whole round out of place.
    afterRenderEffect(() => {
      if (this.game.status() === 'playing' && !this.launching()) {
        this.answerInput()?.nativeElement.focus({ preventScroll: true });
      }
    });

    // Make the score jump whenever it goes up.
    let shownPoints = 0;
    afterRenderEffect(() => {
      const points = this.game.totalPoints();
      const element = this.score()?.nativeElement;
      const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (element?.animate && points > shownPoints && !reduceMotion) {
        element.animate([{ scale: 1.6, color: 'var(--color-star-300)' }, { scale: 1 }], {
          duration: 500,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)',
        });
      }
      shownPoints = points;
    });

    void this.newRound();
  }

  protected async newRound(): Promise<void> {
    this.stopTimers();
    await this.game.start(this.mode);
    if (this.game.status() === 'playing') {
      if (this.showLaunch) {
        await this.launch();
      } else {
        this.sound.play('liftoff');
      }
    }
    this.beginCategory();
  }

  /** Countdown on the launch pad and the climb into space; resolves when it ends. */
  private launch(): Promise<void> {
    this.launching.set(true);
    const at = (ms: number, action: () => void) => this.launchTimers.push(setTimeout(action, ms));
    for (const beat of COUNTDOWN_BEATS) {
      at(beat, () => this.sound.play('tick'));
    }
    at(LIFTOFF_MS, () => {
      this.sound.play('liftoff');
      this.sound.play('thrust', (LAUNCH_MS - LIFTOFF_MS) / 1000);
    });
    return new Promise((resolve) => {
      this.endLaunch = () => {
        this.clearLaunch();
        this.launching.set(false);
        resolve();
      };
      at(LAUNCH_MS, () => this.endLaunch?.());
    });
  }

  /** Goes straight to the first category. */
  protected skipLaunch(): void {
    this.endLaunch?.();
  }

  private clearLaunch(): void {
    this.launchTimers.forEach((timer) => clearTimeout(timer));
    this.launchTimers = [];
    this.endLaunch = undefined;
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.finishCategory(false);
  }

  private beginCategory(): void {
    this.clearField();
    this.retryMessage.set('');
    if (this.game.status() === 'playing' && this.game.timerEnabled()) {
      const { seconds } = this.game.mode().rules.clock;
      this.countdown.start(seconds, () => this.finishCategory(true));
    }
  }

  private finishCategory(timedOut: boolean): void {
    if (this.launching()) {
      return;
    }
    const before = this.game.totalPoints();
    const result = this.game.answer(this.draft(), timedOut);
    if (!result) {
      return;
    }
    if (this.game.status() === 'playing') {
      this.askToRetry();
      return;
    }
    this.countdown.stop();
    this.clearField();
    // Put the phone keyboard away, so the whole flight can be seen. The field gets the
    // focus back with the next category (where the browser allows it without a tap).
    this.answerInput()?.nativeElement.blur();
    this.revealKm.set(
      result.points > 0
        ? formatDistance(distanceAt(before + result.points) - distanceAt(before))
        : undefined,
    );
    this.sound.play(result.match ? result.match.rarity : 'miss');
    this.revealTimer = setTimeout(
      () => {
        this.game.next();
        this.sound.play(this.game.status() === 'finished' ? 'finish' : 'deal');
        this.beginCategory();
      },
      revealDelay(before, before + result.points),
    );
  }

  /** The answer is not in the base: keep the category and the text so it can be fixed. */
  private askToRetry(): void {
    this.retryMessage.set(RETRY_MESSAGES[this.retries++ % RETRY_MESSAGES.length]);
    this.sound.play('miss');
    const field = this.answerInput()?.nativeElement;
    const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (field?.animate && !reduceMotion) {
      field.animate(
        [
          { translate: '0' },
          { translate: '-0.5rem' },
          { translate: '0.5rem' },
          { translate: '-0.3rem' },
          { translate: '0' },
        ],
        { duration: 380, easing: 'ease-in-out' },
      );
    }
  }

  /** Typing again hides the retry message. */
  protected type(value: string): void {
    this.draft.set(value);
    this.retryMessage.set('');
  }

  /**
   * Empties the answer field. The element is cleared too: when Enter comes right
   * after the last key, the screen may not have caught up with the typed text yet.
   */
  private clearField(): void {
    this.draft.set('');
    const field = this.answerInput()?.nativeElement;
    if (field) {
      field.value = '';
    }
  }

  private stopTimers(): void {
    this.countdown.stop();
    this.clearLaunch();
    clearTimeout(this.revealTimer);
  }
}
