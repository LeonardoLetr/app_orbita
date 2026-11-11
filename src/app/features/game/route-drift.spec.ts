import { CRUISE_PER_SECOND, MAX_LEAD, RouteDrift } from './route-drift';

describe('RouteDrift', () => {
  /** Lets seconds go by in animation frames. */
  function run(drift: RouteDrift, seconds: number, onFrame?: () => void) {
    for (let i = 0; i < seconds * 60; i++) {
      drift.advance(1 / 60);
      onFrame?.();
    }
  }

  it('starts with the rocket where its score puts it', () => {
    expect(new RouteDrift().lead).toBe(0);
  });

  it('cruises at a slow, steady pace at first', () => {
    const drift = new RouteDrift();

    run(drift, 2);

    expect(drift.lead).toBeGreaterThan(CRUISE_PER_SECOND * 2 * 0.9);
    expect(drift.lead).toBeLessThanOrEqual(CRUISE_PER_SECOND * 2);
  });

  it('eases off near its limit instead of stopping dead', () => {
    const drift = new RouteDrift();
    run(drift, 20);
    const early = drift.speed;
    run(drift, 40);
    const late = drift.speed;
    run(drift, 600);

    expect(late).toBeLessThan(early);
    expect(late).toBeGreaterThan(0);
    expect(drift.lead).toBeLessThanOrEqual(MAX_LEAD);
    expect(drift.lead).toBeGreaterThan(MAX_LEAD * 0.95);
  });

  it('keeps part of a boost for after the flight', () => {
    const drift = new RouteDrift();

    const tail = drift.boost(2, 4);

    expect(tail).toBeGreaterThan(0);
    expect(tail).toBeLessThan(1);
  });

  it('holds that part back during the flight and hands it over afterwards', () => {
    const drift = new RouteDrift();
    const tail = drift.boost(2, 4);

    run(drift, 4);
    // Behind the score by what was held back, less the little it cruised meanwhile.
    expect(drift.lead).toBeLessThan(0);
    expect(drift.lead).toBeGreaterThan(-tail);

    run(drift, 12);
    expect(drift.lead).toBeGreaterThan(0);
  });

  it('goes on moving right after the flight, faster than the cruise, and slows down little by little', () => {
    const drift = new RouteDrift();
    drift.boost(2, 4);
    run(drift, 4);

    const speeds: number[] = [];
    run(drift, 6, () => speeds.push(drift.speed));

    expect(speeds[0]).toBeGreaterThan(CRUISE_PER_SECOND * 3);
    for (let i = 1; i < speeds.length; i++) {
      expect(speeds[i]).toBeLessThanOrEqual(speeds[i - 1] + 1e-9);
    }
    expect(speeds.at(-1)!).toBeLessThan(speeds[0] / 3);
    expect(speeds.at(-1)!).toBeGreaterThan(0);
  });

  it('never moves the route backwards faster than the flight carries it forward', () => {
    const drift = new RouteDrift();
    run(drift, 25);
    const stops = 0.4;
    const seconds = 2;
    drift.boost(stops, seconds);

    let before = drift.lead;
    let heldBack = 0;
    run(drift, seconds, () => {
      heldBack += Math.max(0, before - drift.lead);
      before = drift.lead;
    });

    expect(heldBack).toBeLessThan(stops);
  });

  it('takes back half of the lead with a boost', () => {
    const drift = new RouteDrift();
    run(drift, 30);
    const before = drift.lead;

    drift.boost(3, 3);
    run(drift, 3 + 15);

    // After the momentum is spent: half the old lead, plus what it cruised since.
    expect(drift.lead).toBeLessThan(before / 2 + CRUISE_PER_SECOND * 18 + 0.01);
    expect(drift.lead).toBeGreaterThan(before / 2);
  });

  it('gives nothing to an answer that scored nothing', () => {
    const drift = new RouteDrift();

    expect(drift.boost(0, 0)).toBe(0);
    run(drift, 1);

    expect(drift.lead).toBeGreaterThan(0);
  });

  it('can be pushed without a flight, as at the end of the launch', () => {
    const calm = new RouteDrift();
    const pushed = new RouteDrift();

    pushed.kick(0.1);

    expect(pushed.speed).toBeGreaterThan(calm.speed * 2);
    run(calm, 10);
    run(pushed, 10);
    expect(pushed.lead).toBeGreaterThan(calm.lead + 0.08);
  });

  it('goes back to the ground for a new round', () => {
    const drift = new RouteDrift();
    run(drift, 40);
    drift.boost(1, 3);
    run(drift, 1);

    drift.reset();

    expect(drift.lead).toBe(0);
    expect(drift.speed).toBe(CRUISE_PER_SECOND);
  });
});
