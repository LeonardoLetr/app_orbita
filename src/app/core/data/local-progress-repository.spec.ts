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
    timerEnabled: true,
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
    expect(progress.bestPoints).toBe(70);
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

    store.setItem(PROGRESS_KEY, JSON.stringify({ version: 99, bestPoints: 10 }));
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });

  it('drops invalid entries from saved data', async () => {
    store.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        rounds: [round('ok', 40, 'mars'), { id: 'bad' }],
        totalRounds: 'many',
        bestPoints: 40,
        reachedPlanets: ['mars', 'vulcan'],
      }),
    );

    const progress = await repository.load();
    expect(progress.rounds.map((r) => r.id)).toEqual(['ok']);
    expect(progress.totalRounds).toBe(1);
    expect(progress.reachedPlanets).toEqual(['mars']);
  });

  it('clears everything', async () => {
    await repository.addRound(round('a', 70, 'jupiter'));

    expect(await repository.clear()).toEqual(EMPTY_PROGRESS);
    expect(await repository.load()).toEqual(EMPTY_PROGRESS);
  });
});
