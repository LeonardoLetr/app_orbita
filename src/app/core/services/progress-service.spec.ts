import { TestBed } from '@angular/core/testing';
import { ProgressRepository } from '../data/progress-repository';
import { GameModeId } from '../models/game-mode';
import { EMPTY_PROGRESS, PlayerProgress } from '../models/progress';
import { provideTestProgress } from '../../testing/test-providers';
import { ProgressService } from './progress-service';

describe('ProgressService', () => {
  let progress: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestProgress() });
    progress = TestBed.inject(ProgressService);
  });

  function play(points: number, planetId: 'moon' | 'mars' | 'jupiter') {
    return progress.record({ points, planetId, mode: 'classic', answers: [] });
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

describe('ProgressService with more than one mode', () => {
  /** A stand-in for the extra modes still to come. */
  const extra = 'extra' as GameModeId;
  /** Records of a player who knows both modes. */
  const bothModes = Object.fromEntries([
    ['classic', 300],
    [extra, 40],
  ]) as PlayerProgress['bestByMode'];

  function withSaved(saved: PlayerProgress): ProgressService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProgressRepository,
          useValue: { load: async () => saved, addRound: async () => saved },
        },
      ],
    });
    return TestBed.inject(ProgressService);
  }

  it('keeps a record for each mode', async () => {
    const progress = withSaved({
      ...EMPTY_PROGRESS,
      totalRounds: 5,
      bestByMode: bothModes,
    });
    await progress.load();

    expect(progress.bestFor('classic')).toBe(300);
    expect(progress.bestFor(extra)).toBe(40);
    expect(progress.bestPoints()).toBe(300);
  });

  it('compares a round only with the same mode', async () => {
    const progress = withSaved({
      ...EMPTY_PROGRESS,
      totalRounds: 5,
      bestByMode: bothModes,
    });

    const outcome = await progress.record({
      mode: extra,
      points: 50,
      planetId: 'moon',
      answers: [],
    });

    expect(outcome.isNewBest).toBe(true);
    expect(outcome.isFirstRound).toBe(false);
  });

  it('knows which modes were played and lists their records', async () => {
    const progress = withSaved({
      ...EMPTY_PROGRESS,
      totalRounds: 5,
      bestByMode: { blitz: 480, classic: 300 },
    });
    await progress.load();

    expect(progress.played('classic')).toBe(true);
    expect(progress.played('blitz')).toBe(true);
    // In the order the modes are offered, not the order they were saved in.
    expect(progress.records().map(({ mode, points }) => [mode.id, points])).toEqual([
      ['classic', 300],
      ['blitz', 480],
    ]);
  });

  it('has no record for a mode never played', async () => {
    const progress = withSaved({ ...EMPTY_PROGRESS, totalRounds: 2, bestByMode: { blitz: 0 } });
    await progress.load();

    expect(progress.played('classic')).toBe(false);
    expect(progress.played('blitz')).toBe(true);
    expect(progress.records().map(({ mode, points }) => [mode.id, points])).toEqual([['blitz', 0]]);
  });

  it('treats the first round in a mode as a first round', async () => {
    const progress = withSaved({ ...EMPTY_PROGRESS, totalRounds: 5, bestByMode: { classic: 300 } });

    const outcome = await progress.record({
      mode: extra,
      points: 50,
      planetId: 'moon',
      answers: [],
    });

    expect(outcome.isFirstRound).toBe(true);
    expect(progress.bestFor(extra)).toBe(0);
  });
});
