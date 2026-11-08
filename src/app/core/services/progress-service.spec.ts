import { TestBed } from '@angular/core/testing';
import { provideTestProgress } from '../../testing/test-providers';
import { ProgressService } from './progress-service';

describe('ProgressService', () => {
  let progress: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestProgress() });
    progress = TestBed.inject(ProgressService);
  });

  function play(points: number, planetId: 'moon' | 'mars' | 'jupiter') {
    return progress.record({ points, planetId, timerEnabled: true, answers: [] });
  }

  it('records the first round as a new record and a new planet', async () => {
    expect(await play(45, 'mars')).toEqual({
      isFirstRound: true,
      isNewBest: true,
      isNewPlanet: true,
    });
    expect(progress.bestPoints()).toBe(45);
    expect(progress.totalRounds()).toBe(1);
    expect(progress.reachedPlanets().has('mars')).toBe(true);
  });

  it('only flags what actually changed', async () => {
    await play(70, 'jupiter');

    expect(await play(45, 'mars')).toEqual({
      isFirstRound: false,
      isNewBest: false,
      isNewPlanet: true,
    });
    expect(await play(75, 'jupiter')).toEqual({
      isFirstRound: false,
      isNewBest: true,
      isNewPlanet: false,
    });
  });

  it('keeps the newest round first', async () => {
    await play(30, 'moon');
    await play(70, 'jupiter');

    expect(progress.rounds().map((round) => round.points)).toEqual([70, 30]);
    expect(progress.lastOutcome()?.isNewBest).toBe(true);
  });

  it('clears the progress', async () => {
    await play(70, 'jupiter');

    await progress.clear();

    expect(progress.totalRounds()).toBe(0);
    expect(progress.rounds()).toEqual([]);
    expect(progress.lastOutcome()).toBeUndefined();
  });
});
