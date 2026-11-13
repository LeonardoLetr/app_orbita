/** The four control values of a CSS cubic-bezier() easing. */
export type Easing = readonly [number, number, number, number];

/**
 * Easing of the flights along the route, the same as in the scene's CSS: off from rest,
 * fast through the middle, easing to a stop on arrival.
 */
export const FLY_EASING: Easing = [0.45, 0, 0.2, 1];
/** Easing of the climb off the Earth at launch, the same as in the scene's CSS. */
export const LIFTOFF_EASING: Easing = [0.45, 0, 0.5, 0.85];

/** Progress (0 to 1) of a CSS cubic-bezier easing at a time fraction (0 to 1). */
export function ease([x1, y1, x2, y2]: Easing, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const curve = (t: number, a: number, b: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  // Find the curve parameter whose horizontal position is x, by bisection.
  let low = 0;
  let high = 1;
  let t = x;
  for (let i = 0; i < 30; i++) {
    t = (low + high) / 2;
    if (curve(t, x1, x2) < x) low = t;
    else high = t;
  }
  return curve(t, y1, y2);
}

/**
 * One flight of the route: how far it moves, in pixels, over how long and with which
 * easing. Gives its speed at any moment, so drawings can move along with the CSS motion.
 */
export class FlightMotion {
  private start = 0;
  private duration = 0;
  private distance = 0;
  private easing: Easing = FLY_EASING;

  begin(now: number, durationMs: number, distancePx: number, easing: Easing): void {
    this.start = now;
    this.duration = durationMs;
    this.distance = distancePx;
    this.easing = easing;
  }

  /** Speed of the route at `now`, in pixels per second (0 when not flying). */
  speed(now: number): number {
    if (this.duration <= 0) return 0;
    const t = (now - this.start) / this.duration;
    if (t < 0 || t >= 1) return 0;
    const step = 0.01;
    const from = Math.max(0, t - step);
    const to = Math.min(1, t + step);
    const progress = ease(this.easing, to) - ease(this.easing, from);
    return (progress / ((to - from) * this.duration)) * this.distance * 1000;
  }
}
