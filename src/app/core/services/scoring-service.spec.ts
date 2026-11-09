import { TestBed } from '@angular/core/testing';
import { Category } from '../models/category';
import { ScoringService } from './scoring-service';

describe('ScoringService', () => {
  const category: Category = {
    id: 'sea-animal',
    title: 'Animal que vive no mar',
    answers: [
      { text: 'Tubarão', rarity: 'satellite' },
      { text: 'Foca', rarity: 'meteorite' },
      { text: 'Peixe-boi', rarity: 'comet', synonyms: ['manati'] },
      { text: 'Coral', rarity: 'pulsar' },
      { text: 'Narval', rarity: 'supernova' },
    ],
  };

  let scoring: ScoringService;

  beforeEach(() => {
    scoring = TestBed.inject(ScoringService);
  });

  it('gives points according to the answer rarity', () => {
    expect(scoring.score(category, 'Tubarão').points).toBe(10);
    expect(scoring.score(category, 'Foca').points).toBe(25);
    expect(scoring.score(category, 'Peixe-boi').points).toBe(50);
    expect(scoring.score(category, 'Coral').points).toBe(75);
    expect(scoring.score(category, 'Narval').points).toBe(100);
  });

  it('ignores case, accents, hyphens and extra spaces', () => {
    const result = scoring.score(category, '  PEIXE   boi ');

    expect(result.outcome).toBe('scored');
    expect(result.match?.text).toBe('Peixe-boi');
    expect(scoring.score(category, 'tubarao').points).toBe(10);
  });

  it('accepts synonyms with the same points', () => {
    const result = scoring.score(category, 'Manati');

    expect(result.points).toBe(50);
    expect(result.match?.text).toBe('Peixe-boi');
  });

  it('keeps the trimmed input', () => {
    expect(scoring.score(category, '  Narval ').input).toBe('Narval');
  });

  it('gives zero for answers outside the base', () => {
    expect(scoring.score(category, 'Sereia')).toEqual({
      input: 'Sereia',
      outcome: 'unknown',
      points: 0,
    });
  });

  it('marks empty answers as blank', () => {
    expect(scoring.score(category, '   ')).toEqual({ input: '', outcome: 'blank', points: 0 });
  });

  it('marks empty answers as timeout when time ran out', () => {
    expect(scoring.score(category, '', true).outcome).toBe('timeout');
  });

  it('still scores what was typed when time ran out', () => {
    expect(scoring.score(category, 'narval', true).points).toBe(100);
  });

  describe('destinations', () => {
    it('starts in Earth orbit', () => {
      expect(scoring.destinationFor(0).id).toBe('earth-orbit');
      expect(scoring.destinationFor(39).id).toBe('earth-orbit');
    });

    it('reaches a planet once its minimum is hit', () => {
      expect(scoring.destinationFor(40).id).toBe('moon');
      expect(scoring.destinationFor(175).id).toBe('mars');
      expect(scoring.destinationFor(370).id).toBe('uranus');
      expect(scoring.destinationFor(700).id).toBe('pluto');
    });

    it('points to the next planet', () => {
      expect(scoring.nextDestination(120)?.id).toBe('jupiter');
      expect(scoring.nextDestination(0)?.minPoints).toBe(40);
    });

    it('has no next planet at the end of the journey', () => {
      expect(scoring.nextDestination(600)).toBeUndefined();
    });
  });

  describe('rarest answers', () => {
    const fruit: Category = {
      id: 'fruit',
      title: 'Fruta',
      answers: [
        { text: 'Banana', rarity: 'satellite' },
        { text: 'Maçã', rarity: 'satellite' },
        { text: 'Goiaba', rarity: 'comet' },
        { text: 'Lichia', rarity: 'supernova' },
        { text: 'Cupuaçu', rarity: 'supernova' },
      ],
    };

    it('puts the rarest answers first', () => {
      const texts = scoring.rarestAnswers(fruit, 3).map((answer) => answer.text);

      expect(texts.slice(0, 2).sort()).toEqual(['Cupuaçu', 'Lichia']);
      expect(texts[2]).toBe('Goiaba');
    });

    it('respects the limit', () => {
      expect(scoring.rarestAnswers(fruit, 1)).toHaveLength(1);
    });

    it('leaves out the answer the player already gave', () => {
      const lichia = fruit.answers[3];

      expect(scoring.rarestAnswers(fruit, 3, lichia)).not.toContain(lichia);
    });
  });
});
