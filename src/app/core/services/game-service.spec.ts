import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from '../data/category-repository';
import { Category } from '../models/category';
import { provideTestProgress } from '../../testing/test-providers';
import { RANDOM } from '../utils/random';
import { CATEGORIES_PER_ROUND, GameService } from './game-service';
import { ProgressService } from './progress-service';

function makeCategory(id: string): Category {
  return {
    id,
    title: `Categoria ${id}`,
    answers: [
      { text: `${id} comum`, rarity: 'satellite' },
      { text: `${id} rara`, rarity: 'supernova' },
    ],
  };
}

describe('GameService', () => {
  const categories = Array.from({ length: 16 }, (_, i) => makeCategory(`c${i}`));
  let getAll: () => Promise<Category[]>;
  let game: GameService;

  beforeEach(() => {
    getAll = () => Promise.resolve(categories);
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryRepository, useValue: { getAll: () => getAll() } },
        { provide: RANDOM, useValue: () => 0 },
        provideTestProgress(),
      ],
    });
    game = TestBed.inject(GameService);
  });

  it('starts idle', () => {
    expect(game.status()).toBe('idle');
  });

  it('draws distinct categories for a round', async () => {
    await game.start();

    const ids = game.entries().map((entry) => entry.category.id);
    expect(ids).toHaveLength(CATEGORIES_PER_ROUND);
    expect(new Set(ids).size).toBe(CATEGORIES_PER_ROUND);
    expect(game.status()).toBe('playing');
    expect(game.index()).toBe(0);
  });

  it('avoids the categories of the previous round', async () => {
    await game.start();
    const first = game.entries().map((entry) => entry.category.id);

    await game.start();
    const second = game.entries().map((entry) => entry.category.id);

    expect(second.some((id) => first.includes(id))).toBe(false);
  });

  it('scores the current category and reveals it', async () => {
    await game.start();
    const current = game.current()!.category;

    const result = game.answer(`${current.id} rara`);

    expect(result?.points).toBe(100);
    expect(game.status()).toBe('revealing');
    expect(game.totalPoints()).toBe(100);
  });

  it('ignores answers while revealing', async () => {
    await game.start();
    game.answer('');

    expect(game.answer('outra')).toBeUndefined();
  });

  it('lets the player try again when an answer is not in the base', async () => {
    await game.start();

    const result = game.answer('Sereia');

    expect(result?.outcome).toBe('unknown');
    expect(game.status()).toBe('playing');
    expect(game.current()?.result).toBeUndefined();
  });

  it('keeps an answer outside the base when time runs out', async () => {
    await game.start();

    game.answer('Sereia', true);

    expect(game.status()).toBe('revealing');
    expect(game.current()?.result?.outcome).toBe('unknown');
  });

  it('finishes after every category is answered', async () => {
    await game.start();

    for (let i = 0; i < CATEGORIES_PER_ROUND; i++) {
      const current = game.current()!.category;
      game.answer(`${current.id} comum`);
      game.next();
    }

    expect(game.status()).toBe('finished');
    expect(game.totalPoints()).toBe(10 * CATEGORIES_PER_ROUND);
  });

  it('saves the round in the history when it finishes', async () => {
    await game.start();
    for (let i = 0; i < CATEGORIES_PER_ROUND; i++) {
      game.answer(i === 0 ? `${game.current()!.category.id} rara` : '');
      game.next();
    }
    const progress = TestBed.inject(ProgressService);
    await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));

    const [round] = progress.rounds();
    expect(round.points).toBe(100);
    expect(round.planetId).toBe('mars');
    expect(round.answers).toHaveLength(CATEGORIES_PER_ROUND);
    expect(round.answers[1].result.outcome).toBe('blank');
  });

  it('records a timeout when time runs out with nothing typed', async () => {
    await game.start();

    expect(game.answer('', true)?.outcome).toBe('timeout');
  });

  it('reports an error when categories fail to load', async () => {
    getAll = () => Promise.reject(new Error('offline'));

    await game.start();

    expect(game.status()).toBe('error');
  });
});
