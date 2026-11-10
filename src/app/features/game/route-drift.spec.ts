import { DRIFT_PER_SECOND, MAX_LEAD, RouteDrift } from './route-drift';

describe('RouteDrift', () => {
  it('starts with the rocket where its score puts it', () => {
    expect(new RouteDrift().lead).toBe(0);
  });

  it('creeps ahead at a slow, constant pace', () => {
    const drift = new RouteDrift();

    drift.advance(10);
    expect(drift.lead).toBeCloseTo(DRIFT_PER_SECOND * 10);

    drift.advance(10);
    expect(drift.lead).toBeCloseTo(DRIFT_PER_SECOND * 20);
  });

  it('is too slow to cover even half a stop during one category', () => {
    const drift = new RouteDrift();

    drift.advance(30);

    expect(drift.lead).toBeLessThan(0.5);
  });

  it('never gets more than half a stop ahead of the score', () => {
    const drift = new RouteDrift();

    drift.advance(10_000);

    expect(drift.lead).toBe(MAX_LEAD);
  });

  it('gives back half of the lead along a boost, and keeps creeping', () => {
    const drift = new RouteDrift();
    drift.advance(50);
    const before = drift.lead;

    drift.boost(2, 4);
    drift.advance(2);
    expect(drift.lead).toBeCloseTo(before - before / 4 + DRIFT_PER_SECOND * 2);

    drift.advance(2);
    expect(drift.lead).toBeCloseTo(before / 2 + DRIFT_PER_SECOND * 4);

    drift.advance(5);
    expect(drift.lead).toBeCloseTo(before / 2 + DRIFT_PER_SECOND * 9);
  });

  it('never gives back more than half of a short flight, so the rocket only moves forward', () => {
    const drift = new RouteDrift();
    drift.advance(80);
    const before = drift.lead;

    drift.boost(0.1, 1);
    drift.advance(1);

    expect(drift.lead).toBeCloseTo(before - 0.05 + DRIFT_PER_SECOND);
  });

  it('gives nothing back for an answer that scored nothing', () => {
    const drift = new RouteDrift();
    drift.advance(20);
    const before = drift.lead;

    drift.boost(0, 0);
    drift.advance(1);

    expect(drift.lead).toBeCloseTo(before + DRIFT_PER_SECOND);
  });

  it('goes back to the ground for a new round', () => {
    const drift = new RouteDrift();
    drift.advance(40);
    drift.boost(1, 3);

    drift.reset();
    drift.advance(1);

    expect(drift.lead).toBeCloseTo(DRIFT_PER_SECOND);
  });
});
