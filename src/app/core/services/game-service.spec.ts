import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from '../data/category-repository';
import { CLASSIC_CATEGORIES } from '../data/classic-rules';
import {
  BLITZ_MODE,
  CLASSIC_MODE,
  LETTER_MODE,
  SURVIVAL_MODE,
  THEMED_MODES,
} from '../data/game-modes';
import { Category } from '../models/category';
import { GameMode } from '../models/game-mode';
import { provideTestProgress } from '../../testing/test-providers';
import { RANDOM } from '../utils/random';
import { GameService } from './game-service';
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
    expect(ids).toHaveLength(CLASSIC_CATEGORIES);
    expect(new Set(ids).size).toBe(CLASSIC_CATEGORIES);
    expect(game.status()).toBe('playing');
    expect(game.index()).toBe(0);
  });

  it('plays the classic mode unless told otherwise', async () => {
    await game.start();

    expect(game.mode()).toBe(CLASSIC_MODE);
  });

  it('asks the rules of the mode which categories to play', async () => {
    const short: GameMode = {
      ...CLASSIC_MODE,
      name: 'Curto',
      rules: { ...CLASSIC_MODE.rules, pickCategories: (all) => all.slice(3, 5) },
    };

    await game.start(short);

    expect(game.mode()).toBe(short);
    expect(game.entries().map((entry) => entry.category.id)).toEqual(['c3', 'c4']);

    game.answer('');
    game.next();
    game.answer('');
    game.next();
    expect(game.status()).toBe('finished');
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

    for (let i = 0; i < CLASSIC_CATEGORIES; i++) {
      const current = game.current()!.category;
      game.answer(`${current.id} comum`);
      game.next();
    }

    expect(game.status()).toBe('finished');
    expect(game.totalPoints()).toBe(10 * CLASSIC_CATEGORIES);
  });

  it('saves the round in the history when it finishes', async () => {
    await game.start();
    for (let i = 0; i < CLASSIC_CATEGORIES; i++) {
      game.answer(i === 0 ? `${game.current()!.category.id} rara` : '');
      game.next();
    }
    const progress = TestBed.inject(ProgressService);
    await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));

    const [round] = progress.rounds();
    expect(round.mode).toBe('classic');
    expect(round.points).toBe(100);
    expect(round.planetId).toBe('mars');
    expect(round.answers).toHaveLength(CLASSIC_CATEGORIES);
    expect(round.answers[1].result.outcome).toBe('blank');
  });

  it('can end before every category is asked, keeping only the ones that were', async () => {
    await game.start();
    game.answer(`${game.current()!.category.id} rara`);
    game.next();
    const second = game.current()!.category.id;
    game.answer('', true);

    game.finish();

    expect(game.status()).toBe('finished');
    expect(game.entries()).toHaveLength(2);
    expect(game.entries()[1].category.id).toBe(second);
    expect(game.totalPoints()).toBe(100);

    const progress = TestBed.inject(ProgressService);
    await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));
    expect(progress.rounds()[0].answers).toHaveLength(2);
  });

  it('only ends early once the current answer is in', async () => {
    await game.start();

    game.finish();

    expect(game.status()).toBe('playing');
    expect(game.entries()).toHaveLength(CLASSIC_CATEGORIES);
  });

  it('avoids in the next round only the categories that were asked', async () => {
    await game.start();
    const [asked, neverAsked] = game.entries().map((entry) => entry.category.id);
    game.answer('');
    game.finish();

    await game.start();
    const next = game.entries().map((entry) => entry.category.id);

    expect(next).not.toContain(asked);
    expect(next).toContain(neverAsked);
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

  describe('with lives', () => {
    const answerRight = () => game.answer(`${game.current()!.category.id} comum`);

    it('starts with the lives of the mode, and has none in modes without them', async () => {
      await game.start();
      expect(game.lives()).toBeUndefined();

      await game.start(SURVIVAL_MODE);
      expect(game.lives()).toBe(3);
    });

    it('loses a life when a category is skipped or its time runs out', async () => {
      await game.start(SURVIVAL_MODE);

      game.answer('');
      expect(game.lives()).toBe(2);
      game.next();

      game.answer('Sereia', true);
      expect(game.lives()).toBe(1);
    });

    it('keeps the lives for valid answers and while the player tries again', async () => {
      await game.start(SURVIVAL_MODE);

      game.answer('Sereia');
      expect(game.lives()).toBe(3);
      answerRight();
      game.next();

      expect(game.lives()).toBe(3);
      expect(game.status()).toBe('playing');
    });

    it('ends when the last life goes, keeping only the categories asked', async () => {
      await game.start(SURVIVAL_MODE);
      answerRight();
      game.next();
      for (let i = 0; i < 3; i++) {
        expect(game.status()).toBe('playing');
        game.answer('');
        game.next();
      }

      expect(game.status()).toBe('finished');
      expect(game.lives()).toBe(0);
      expect(game.entries()).toHaveLength(4);
      expect(game.totalPoints()).toBe(10);

      const progress = TestBed.inject(ProgressService);
      await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));
      expect(progress.rounds()[0].mode).toBe('survival');
      expect(progress.rounds()[0].answers).toHaveLength(4);
    });

    it('draws the categories again when they were all asked, not repeating the latest', async () => {
      await game.start(SURVIVAL_MODE);
      for (let i = 0; i < categories.length; i++) {
        answerRight();
        game.next();
      }

      expect(game.status()).toBe('playing');
      expect(game.entries()).toHaveLength(categories.length * 2);
      const ids = game.entries().map((entry) => entry.category.id);
      expect(ids[categories.length]).not.toBe(ids[categories.length - 1]);
      expect(new Set(ids.slice(categories.length)).size).toBe(categories.length);
    });

    it('saves a destination beyond Pluto', async () => {
      await game.start(SURVIVAL_MODE);
      // Nine rare answers: 900 points, past Eris.
      for (let i = 0; i < 9; i++) {
        game.answer(`${game.current()!.category.id} rara`);
        game.next();
      }
      for (let i = 0; i < 3; i++) {
        game.answer('');
        game.next();
      }

      const progress = TestBed.inject(ProgressService);
      await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));
      expect(progress.rounds()[0].planetId).toBe('eris');
      expect(progress.reachedPlanets().has('eris')).toBe(true);
    });
  });

  it('saves the theme with a round played by theme', async () => {
    const themed = THEMED_MODES[0];
    getAll = () =>
      Promise.resolve(categories.map((category) => ({ ...category, themes: [themed.theme!.id] })));
    await game.start(themed);
    for (let i = 0; i < CLASSIC_CATEGORIES; i++) {
      game.answer('');
      game.next();
    }

    const progress = TestBed.inject(ProgressService);
    await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));
    expect(progress.rounds()[0].mode).toBe('theme');
    expect(progress.rounds()[0].theme).toBe(themed.theme!.id);
  });

  describe('where skipping is not allowed', () => {
    it('ignores a blank answer and keeps waiting', async () => {
      await game.start(BLITZ_MODE);

      expect(game.answer('')).toBeUndefined();
      expect(game.answer('   ')).toBeUndefined();
      expect(game.status()).toBe('playing');
      expect(game.current()?.result).toBeUndefined();
    });

    it('still ends the category when its time runs out with nothing typed', async () => {
      await game.start(BLITZ_MODE);

      expect(game.answer('', true)?.outcome).toBe('timeout');
      expect(game.status()).toBe('revealing');
    });
  });

  describe('with a letter drawn', () => {
    /** Ten categories with five answers in B and five in C; three more with A only. */
    const lettered: Category[] = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `bc${i}`,
        title: `BC ${i}`,
        answers: ['b', 'c'].flatMap((letter) =>
          Array.from({ length: 5 }, (_, n) => ({
            text: `${letter}${i}x${n}`,
            rarity: 'comet' as const,
          })),
        ),
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `a${i}`,
        title: `A ${i}`,
        answers: Array.from({ length: 5 }, (_, n) => ({
          text: `a${i}x${n}`,
          rarity: 'comet' as const,
        })),
      })),
    ];

    beforeEach(() => (getAll = () => Promise.resolve(lettered)));

    it('has no letter in the other modes', async () => {
      await game.start();

      expect(game.letter()).toBeUndefined();
    });

    it('draws a letter with enough categories, and only categories that have it', async () => {
      await game.start(LETTER_MODE);

      expect(game.letter()).toBe('B');
      expect(game.entries()).toHaveLength(CLASSIC_CATEGORIES);
      expect(game.entries().every((entry) => entry.category.id.startsWith('bc'))).toBe(true);
    });

    it('asks again for an answer with another letter, and scores one with the letter', async () => {
      await game.start(LETTER_MODE);
      const id = game.current()!.category.id.slice(2);

      expect(game.answer(`c${id}x0`)?.outcome).toBe('wrong-letter');
      expect(game.status()).toBe('playing');

      expect(game.answer(`b${id}x0`)?.points).toBe(50);
      expect(game.status()).toBe('revealing');
    });

    it('saves the letter with the round', async () => {
      await game.start(LETTER_MODE);
      for (let i = 0; i < CLASSIC_CATEGORIES; i++) {
        game.answer('');
        game.next();
      }

      const progress = TestBed.inject(ProgressService);
      await vi.waitFor(() => expect(progress.totalRounds()).toBe(1));
      expect(progress.rounds()[0].mode).toBe('letter');
      expect(progress.rounds()[0].letter).toBe('B');
    });
  });
});
