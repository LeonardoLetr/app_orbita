import { computed, signal } from '@angular/core';

const TICK_MS = 100;

/** Signal-based countdown. Call `stop()` when the owner is destroyed. */
export class Countdown {
  private readonly totalMs = signal(0);
  private readonly remainingMs = signal(0);
  private timer?: ReturnType<typeof setInterval>;
  private endsAt = 0;
  private onExpire?: () => void;

  /** Whole seconds left, rounded up so the display only hits 0 at the end. */
  readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Fraction of time left, from 1 down to 0. */
  readonly progress = computed(() => (this.totalMs() ? this.remainingMs() / this.totalMs() : 0));
  /** It was started and ran all the way down. */
  readonly expired = computed(() => this.totalMs() > 0 && this.remainingMs() === 0);

  start(seconds: number, onExpire: () => void): void {
    this.stop();
    const total = seconds * 1000;
    this.totalMs.set(total);
    this.remainingMs.set(total);
    this.onExpire = onExpire;
    this.run();
  }

  /** Freezes the time left, until `resume()`. */
  pause(): void {
    if (this.timer === undefined) {
      return;
    }
    this.halt();
    this.remainingMs.set(Math.max(0, this.endsAt - Date.now()));
  }

  /** Goes on from where `pause()` left it. Does nothing when no time is left. */
  resume(): void {
    if (this.timer === undefined && this.onExpire && this.remainingMs() > 0) {
      this.run();
    }
  }

  stop(): void {
    this.halt();
    this.onExpire = undefined;
  }

  private run(): void {
    this.endsAt = Date.now() + this.remainingMs();
    this.timer = setInterval(() => {
      const left = Math.max(0, this.endsAt - Date.now());
      this.remainingMs.set(left);
      if (left === 0) {
        const onExpire = this.onExpire;
        this.stop();
        onExpire?.();
      }
    }, TICK_MS);
  }

  private halt(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
