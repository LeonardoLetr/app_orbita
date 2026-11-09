import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Easing, FLY_EASING, FlightMotion } from './flight-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  smoke: boolean;
}

/** Flame colors from the hottest to the coolest, as a particle ages. */
const FLAME = ['#fff6c2', '#ffd23f', '#ff8f6b', '#ff3d8b'];
const MAX_PARTICLES = 420;
/** Particles are drawn stretched by their speed over this time, like a motion blur. */
const BLUR = 0.035;
/** Engine power when the rocket just floats along. */
const IDLE_THRUST = 0.3;

/**
 * Fire and smoke coming out of the rocket engine, drawn on a canvas just behind the
 * rocket. Stronger while flying, when the trail is also stretched by the speed of the
 * route; off for players who ask for less motion. Decorative.
 */
@Component({
  selector: 'app-exhaust-plume',
  host: { 'aria-hidden': 'true' },
  template: '<canvas #canvas></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0 0 -40% 0;
      pointer-events: none;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class ExhaustPlume {
  /** The rocket drawing; the flame comes out of the bottom of it. */
  readonly anchor = input.required<HTMLElement>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly motion = new FlightMotion();
  private particles: Particle[] = [];
  private context?: CanvasRenderingContext2D;
  private observer?: ResizeObserver;
  private frame = 0;
  private last = 0;
  private width = 0;
  private height = 0;
  private carry = 0;
  /** Launch countdown: the engine builds up until liftoff. */
  private ignition?: { start: number; duration: number };
  /** Thick smoke only near the Earth, during the launch. */
  private smokyUntil = 0;
  private sputterUntil = 0;
  /** Where the engine was on the previous frame. */
  private lastNozzle?: { x: number; y: number };

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
    });
  }

  /** Full power for a flight, with the trail stretched by the route's speed. */
  fly(durationMs: number, distancePx: number, easing: Easing = FLY_EASING, smoky = false): void {
    const now = performance.now();
    this.ignition = undefined;
    this.smokyUntil = smoky ? now + durationMs * 0.6 : 0;
    this.motion.begin(now, durationMs, distancePx, easing);
  }

  /** Engine building up on the launch pad, with thick smoke, until liftoff. */
  ignite(durationMs: number): void {
    this.ignition = { start: performance.now(), duration: durationMs };
  }

  /** A weak cough of smoke, when an answer scores nothing. */
  sputter(): void {
    const now = performance.now();
    this.sputterUntil = now + 600;
    for (let i = 0; i < 10; i++) this.emit(now, true);
  }

  private start(): void {
    // Needs a real browser canvas, and stays off when motion should be reduced.
    if (typeof ResizeObserver === 'undefined') return;
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = this.canvas().nativeElement;
    this.context = canvas.getContext('2d') ?? undefined;
    if (!this.context) return;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  private resize(): void {
    const canvas = this.canvas().nativeElement;
    const ratio = Math.min(2, devicePixelRatio || 1);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    canvas.width = Math.round(this.width * ratio);
    canvas.height = Math.round(this.height * ratio);
    this.context!.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /** Engine power from 0 to 1 at this moment. */
  private thrust(now: number): number {
    if (now < this.sputterUntil) return 0.05;
    if (this.motion.speed(now) > 0) return 1;
    if (this.ignition) {
      const share = Math.min(1, (now - this.ignition.start) / this.ignition.duration);
      return 0.15 + share * 0.75;
    }
    return IDLE_THRUST;
  }

  /** Where the flame starts, in canvas pixels, and the scene unit (rocket width / 10.5). */
  private nozzle(): { x: number; y: number; unit: number } {
    const rocket = this.anchor().getBoundingClientRect();
    const box = this.canvas().nativeElement.getBoundingClientRect();
    return {
      x: rocket.left + rocket.width / 2 - box.left,
      // The engine sits 13/64 of the drawing above its bottom (below it is the drawn flame).
      y: rocket.bottom - (rocket.height * 13) / 64 - box.top,
      unit: rocket.width / 10.5,
    };
  }

  private emit(now: number, smoke: boolean): void {
    if (this.particles.length >= MAX_PARTICLES) return;
    const { x, y, unit } = this.nozzle();
    const power = this.thrust(now);
    this.particles.push({
      x: x + (Math.random() - 0.5) * unit * 2,
      y,
      vx: (Math.random() - 0.5) * unit * (smoke ? 14 : 8),
      vy: unit * (smoke ? 8 + Math.random() * 10 : 30 + Math.random() * 30) * (0.6 + power),
      life: 0,
      maxLife: smoke ? 1 + Math.random() * 0.6 : 0.3 + Math.random() * 0.3,
      size: unit * (smoke ? 2.2 : 0.9 + power * 0.8),
      smoke,
    });
  }

  private tick(now: number): void {
    const seconds = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    const power = this.thrust(now);

    // The route moving down pushes everything behind the rocket down too.
    const wind = this.motion.speed(now);

    // When the rocket itself moves on the screen (the keyboard opens or closes and the
    // scene glides to its new place), the flame moves along instead of hanging behind.
    const nozzle = this.nozzle();
    if (this.lastNozzle) {
      const dx = nozzle.x - this.lastNozzle.x;
      const dy = nozzle.y - this.lastNozzle.y;
      if (dx || dy) {
        for (const particle of this.particles) {
          particle.x += dx;
          particle.y += dy;
        }
      }
    }
    this.lastNozzle = { x: nozzle.x, y: nozzle.y };

    // New particles, at a rate that follows the engine power and the speed.
    const smoky = !!this.ignition || now < this.smokyUntil;
    this.carry += seconds * (25 + 140 * power + wind * 0.1);
    while (this.carry >= 1) {
      this.carry -= 1;
      this.emit(now, false);
      if (smoky && Math.random() < 0.3) this.emit(now, true);
    }

    const context = this.context!;
    context.clearRect(0, 0, this.width, this.height);
    this.particles = this.particles.filter((particle) => {
      particle.life += seconds;
      if (particle.life >= particle.maxLife) return false;
      particle.x += particle.vx * seconds;
      particle.y += (particle.vy + wind) * seconds;
      const left = 1 - particle.life / particle.maxLife;
      const size = particle.size * (particle.smoke ? 1 + (1 - left) * 2 : 0.6 + (1 - left));
      if (particle.smoke) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = left * 0.3;
        context.fillStyle = '#d9dcf0';
        context.beginPath();
        context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        context.fill();
        return true;
      }
      // Flame: a short streak along its movement, so fast trails look continuous.
      const fall = (particle.vy + wind) * BLUR;
      context.globalCompositeOperation = 'lighter';
      context.globalAlpha = left * 0.9;
      context.strokeStyle =
        FLAME[Math.min(FLAME.length - 1, Math.floor((1 - left) * FLAME.length))];
      context.lineWidth = size * 1.6;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x - particle.vx * BLUR, particle.y - Math.max(size * 0.4, fall));
      context.stroke();
      return true;
    });
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }
}
