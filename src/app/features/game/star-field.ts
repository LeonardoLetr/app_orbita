import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { Easing, FLY_EASING, FlightMotion } from './flight-motion';

interface Star {
  x: number;
  y: number;
  /** Closeness, which sets how fast it moves (parallax). */
  depth: number;
  radius: number;
  color: string;
  phase: number;
}

const COLORS = ['#ffffff', '#ffffff', '#ffffff', '#ffe27a', '#8ff3ff', '#c9b8ff'];
/** Slow drift of the sky, in pixels per second at full depth. */
const DRIFT = 110;
/** Length of the streaks, as seconds of movement, and the longest one, in pixels. */
const STREAK = 0.06;
const MAX_STREAK = 170;
/**
 * How much faster than the route the stars stream during a flight. They are the main
 * sign of speed: a boost has to feel several times faster than the cruise.
 */
const FLIGHT_RUSH = 4;

/** Number of stars for a sky of this size, in CSS pixels. */
export function starCount(width: number, height: number): number {
  return Math.max(60, Math.min(420, Math.round((width * height) / 3200)));
}

/**
 * Stars drawn on a canvas behind the route. They drift slowly and stretch into streaks
 * when the rocket flies, at the speed of the flight; still for players who ask for less
 * motion. Decorative.
 */
@Component({
  selector: 'app-star-field',
  host: { 'aria-hidden': 'true' },
  template: '<canvas #canvas></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class StarField {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly motion = new FlightMotion();
  private stars: Star[] = [];
  private context?: CanvasRenderingContext2D;
  private observer?: ResizeObserver;
  private frame = 0;
  private last = 0;
  private width = 0;
  private height = 0;
  private still = false;

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
    });
  }

  /** Streams the stars along with a flight of the route. */
  fly(durationMs: number, distancePx: number, easing: Easing = FLY_EASING): void {
    this.motion.begin(performance.now(), durationMs, distancePx, easing);
  }

  private start(): void {
    // Needs a real browser canvas (not available in unit tests).
    if (typeof ResizeObserver === 'undefined') return;
    const canvas = this.canvas().nativeElement;
    this.context = canvas.getContext('2d') ?? undefined;
    if (!this.context) return;
    this.still = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    if (!this.still) {
      this.frame = requestAnimationFrame((now) => this.tick(now));
    }
  }

  private resize(): void {
    const canvas = this.canvas().nativeElement;
    const ratio = Math.min(2, devicePixelRatio || 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    this.context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (width !== this.width || !this.stars.length) {
      this.stars = this.createStars(width, height, starCount(width, height));
    } else if (height !== this.height) {
      // The screen got taller or shorter: spread the same sky over the new height, so no
      // part of it is left without stars, and keep the same density.
      const stretch = height / this.height;
      for (const star of this.stars) star.y *= stretch;
      const count = starCount(width, height);
      if (count > this.stars.length) {
        this.stars.push(...this.createStars(width, height, count - this.stars.length));
      } else {
        this.stars.length = count;
      }
    }
    this.width = width;
    this.height = height;
    if (this.still) this.draw(0, 0);
  }

  private createStars(width: number, height: number, count: number): Star[] {
    return Array.from({ length: count }, () => {
      const layer = Math.random();
      const depth =
        layer < 0.5
          ? 0.1 + Math.random() * 0.08
          : layer < 0.85
            ? 0.2 + Math.random() * 0.1
            : 0.32 + Math.random() * 0.13;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        radius: 0.5 + depth * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      };
    });
  }

  private tick(now: number): void {
    const seconds = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    this.draw(seconds, now);
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  private draw(seconds: number, now: number): void {
    const context = this.context!;
    const speed = DRIFT + this.motion.speed(now) * FLIGHT_RUSH;
    context.clearRect(0, 0, this.width, this.height);
    context.lineCap = 'round';
    for (const star of this.stars) {
      const starSpeed = speed * star.depth;
      star.y += starSpeed * seconds;
      if (star.y > this.height + 10) {
        star.y -= this.height + 20;
        star.x = Math.random() * this.width;
      }
      const streak = Math.min(MAX_STREAK, starSpeed * STREAK);
      const twinkle = 0.6 + 0.4 * Math.sin(now / 700 + star.phase);
      context.globalAlpha = Math.min(1, twinkle + streak / 40);
      if (streak > 3) {
        context.strokeStyle = star.color;
        context.lineWidth = star.radius * 1.2;
        context.beginPath();
        context.moveTo(star.x, star.y);
        context.lineTo(star.x, star.y - streak);
        context.stroke();
      } else {
        context.fillStyle = star.color;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }
}
