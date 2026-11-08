import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService, SECONDS_PER_CATEGORY } from '../../core/services/game-service';
import { RarityBadge } from '../../shared/components/rarity-badge';
import { Countdown } from './countdown';

/** How long the score of an answer stays on screen before the next category. */
export const REVEAL_MS = 1400;

@Component({
  selector: 'app-game',
  imports: [RouterLink, RarityBadge],
  templateUrl: './game.html',
})
export class Game {
  protected readonly game = inject(GameService);
  protected readonly countdown = new Countdown();
  protected readonly draft = signal('');

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
    if (!this.game.answer(this.draft(), timedOut)) {
      return;
    }
    this.countdown.stop();
    this.revealTimer = setTimeout(() => {
      this.game.next();
      this.beginCategory();
    }, REVEAL_MS);
  }

  private stopTimers(): void {
    this.countdown.stop();
    clearTimeout(this.revealTimer);
  }
}
