import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService, SECONDS_PER_CATEGORY } from '../../core/services/game-service';
import { SoundService } from '../../core/services/sound-service';
import { Result } from '../result/result';
import { AnswerReveal } from './answer-reveal';
import { Countdown } from './countdown';
import { JourneyScene } from './journey-scene';

/** How long the score of an answer stays on screen, while the rocket travels. */
export const REVEAL_MS = 1800;

@Component({
  selector: 'app-game',
  imports: [RouterLink, Result, AnswerReveal, JourneyScene],
  templateUrl: './game.html',
})
export class Game {
  protected readonly game = inject(GameService);
  protected readonly sound = inject(SoundService);
  protected readonly countdown = new Countdown();
  protected readonly draft = signal('');
  /** Spoken to screen reader users when time is about to run out. */
  protected readonly timeWarning = computed(() => {
    const seconds = this.countdown.seconds();
    const counting = this.game.status() === 'playing' && this.game.timerEnabled();
    return counting && (seconds === 10 || seconds === 5) ? `Faltam ${seconds} segundos` : '';
  });
  protected readonly answered = computed(
    () => this.game.entries().filter((entry) => entry.result).length,
  );

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');
  private revealTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimers());

    // Keep the keyboard on the answer field whenever a new category shows up.
    afterRenderEffect(() => {
      if (this.game.status() === 'playing') {
        this.answerInput()?.nativeElement.focus();
      }
    });

    void this.newRound();
  }

  protected async newRound(): Promise<void> {
    this.stopTimers();
    await this.game.start();
    if (this.game.status() === 'playing') {
      this.sound.play('liftoff');
    }
    this.beginCategory();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.finishCategory(false);
  }

  private beginCategory(): void {
    this.draft.set('');
    if (this.game.status() === 'playing' && this.game.timerEnabled()) {
      this.countdown.start(SECONDS_PER_CATEGORY, () => this.finishCategory(true));
    }
  }

  private finishCategory(timedOut: boolean): void {
    const result = this.game.answer(this.draft(), timedOut);
    if (!result) {
      return;
    }
    this.countdown.stop();
    this.sound.play(result.match ? result.match.rarity : 'miss');
    this.revealTimer = setTimeout(() => {
      this.game.next();
      if (this.game.status() === 'finished') {
        this.sound.play('finish');
      }
      this.beginCategory();
    }, REVEAL_MS);
  }

  private stopTimers(): void {
    this.countdown.stop();
    clearTimeout(this.revealTimer);
  }
}
