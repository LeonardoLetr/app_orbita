import { computed, signal } from '@angular/core';

const TICK_MS = 100;

/** Signal-based countdown. Call `stop()` when the owner is destroyed. */
export class Countdown {
  private readonly totalMs = signal(0);
  private readonly remainingMs = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  /** Whole seconds left, rounded up so the display only hits 0 at the end. */
  readonly seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
  /** Fraction of time left, from 1 down to 0. */
  readonly progress = computed(() => (this.totalMs() ? this.remainingMs() / this.totalMs() : 0));

  start(seconds: number, onExpire: () => void): void {
    this.stop();
    const total = seconds * 1000;
    const endsAt = Date.now() + total;
    this.totalMs.set(total);
    this.remainingMs.set(total);

    this.timer = setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      this.remainingMs.set(left);
      if (left === 0) {
        this.stop();
        onExpire();
      }
    }, TICK_MS);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
