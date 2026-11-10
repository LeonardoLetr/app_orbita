import { TestBed } from '@angular/core/testing';
import { EMPTY_PROGRESS, RoundRecord } from '../models/progress';
import { KeyValueStore, STORAGE, createMemoryStore } from '../utils/storage';
import {
  LocalProgressRepository,
  MAX_SAVED_ROUNDS,
  PROGRESS_KEY,
} from './local-progress-repository';

function round(id: string, points: number, planetId: RoundRecord['planetId']): RoundRecord {
  return {
    id,
    playedAt: '2026-11-08T20:00:00.000Z',
    points,
    planetId,
    mode: 'classic',
    answers: [],
  };
}

describe('LocalProgressRepository', () => {
  let store: KeyValueStore;
  let repository: LocalProgressRepository;

  beforeEach(() => {
    store = createMemoryStore();
    TestBed.configureTestingModule({
      providers: [LocalProgressRepository, { provide: STORAGE, useValue: store }],
    });
    repository = TestBed.inject(LocalProgressRepository);
  });

  it('starts empty', async () => {
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });

  it('saves rounds newest first and keeps the record', async () => {
    await repository.addRound(round('a', 70, 'jupiter'));
    await repository.addRound(round('b', 30, 'moon'));

    const progress = await repository.load();
    expect(progress.rounds.map((r) => r.id)).toEqual(['b', 'a']);
    expect(progress.bestByMode).toEqual({ classic: 70 });
    expect(progress.totalRounds).toBe(2);
    expect(progress.reachedPlanets).toEqual(['jupiter', 'moon']);
  });

  it('does not repeat reached planets', async () => {
    await repository.addRound(round('a', 30, 'moon'));
    await repository.addRound(round('b', 35, 'moon'));

    expect((await repository.load()).reachedPlanets).toEqual(['moon']);
  });

  it('keeps only the latest rounds but counts all of them', async () => {
    for (let i = 0; i < MAX_SAVED_ROUNDS + 5; i++) {
      await repository.addRound(round(`r${i}`, i, 'earth-orbit'));
    }

    const progress = await repository.load();
    expect(progress.rounds).toHaveLength(MAX_SAVED_ROUNDS);
    expect(progress.rounds[0].id).toBe(`r${MAX_SAVED_ROUNDS + 4}`);
    expect(progress.totalRounds).toBe(MAX_SAVED_ROUNDS + 5);
  });

  it('ignores broken or unknown saved data', async () => {
    store.setItem(PROGRESS_KEY, '{oops');
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);

    store.setItem(PROGRESS_KEY, JSON.stringify({ version: 99, bestByMode: { classic: 10 } }));
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });

  it('drops invalid entries from saved data', async () => {
    store.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 2,
        rounds: [
          round('ok', 40, 'mars'),
          { id: 'bad' },
          { ...round('other-game', 90, 'moon'), mode: 'warp' },
        ],
        totalRounds: 'many',
        bestByMode: { classic: 40, warp: 90 },
        reachedPlanets: ['mars', 'vulcan'],
      }),
    );

    const progress = await repository.load();
    expect(progress.rounds.map((r) => r.id)).toEqual(['ok']);
    expect(progress.totalRounds).toBe(1);
    expect(progress.bestByMode).toEqual({ classic: 40 });
    expect(progress.reachedPlanets).toEqual(['mars']);
  });

  it('never leaves a record below a saved round', async () => {
    store.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: 2, rounds: [round('a', 40, 'mars')], bestByMode: {} }),
    );

    expect((await repository.load()).bestByMode).toEqual({ classic: 40 });
  });

  describe('with data saved before game modes existed', () => {
    /** Version 1: one record for everything, and rounds with the old timer switch. */
    const old = {
      version: 1,
      rounds: [
        { ...round('b', 30, 'moon'), mode: undefined, timerEnabled: false },
        { ...round('a', 70, 'jupiter'), mode: undefined, timerEnabled: true },
      ],
      totalRounds: 60,
      bestPoints: 180,
      reachedPlanets: ['jupiter', 'moon'],
    };

    beforeEach(() => store.setItem(PROGRESS_KEY, JSON.stringify(old)));

    it('reads it as rounds of the classic mode', async () => {
      const progress = await repository.load();

      expect(progress.rounds).toEqual([round('b', 30, 'moon'), round('a', 70, 'jupiter')]);
      expect(progress.totalRounds).toBe(60);
      expect(progress.bestByMode).toEqual({ classic: 180 });
      expect(progress.reachedPlanets).toEqual(['jupiter', 'moon']);
    });

    it('keeps it when a new round is saved', async () => {
      const progress = await repository.addRound(round('c', 200, 'jupiter'));

      expect(progress.rounds.map((r) => r.id)).toEqual(['c', 'b', 'a']);
      expect(progress.totalRounds).toBe(61);
      expect(progress.bestByMode).toEqual({ classic: 200 });
      const saved = JSON.parse(store.getItem(PROGRESS_KEY)!);
      expect(saved.version).toBe(2);
      expect(saved.rounds[1]).toEqual(round('b', 30, 'moon'));
    });

    it('has no record when nothing had been played', async () => {
      store.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, rounds: [], bestPoints: 0 }));

      expect((await repository.load()).bestByMode).toEqual({});
    });
  });

  it('clears everything', async () => {
    await repository.addRound(round('a', 70, 'jupiter'));

    expect(await repository.clear()).toEqual(EMPTY_PROGRESS);
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });

  it('keeps the theme of rounds played by theme and drops rounds of unknown themes', async () => {
    store.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 2,
        rounds: [
          { ...round('a', 40, 'mars'), mode: 'theme', theme: 'nature' },
          { ...round('b', 50, 'mars'), mode: 'theme', theme: 'unicorns' },
        ],
        totalRounds: 2,
        bestByMode: { theme: 50 },
        reachedPlanets: ['mars'],
      }),
    );

    const progress = await repository.load();

    expect(progress.rounds.map((saved) => [saved.id, saved.theme])).toEqual([['a', 'nature']]);
  });
});
