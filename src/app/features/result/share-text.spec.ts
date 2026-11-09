import { PLANETS } from '../../core/data/planets';
import { shareText } from './share-text';

describe('shareText', () => {
  it('tells where the rocket got with one mark per answer', () => {
    const saturn = PLANETS.find((planet) => planet.id === 'saturn')!;
    const text = shareText(
      saturn,
      335,
      [
        {
          input: 'Narval',
          outcome: 'scored',
          points: 100,
          match: { text: 'Narval', rarity: 'supernova' },
        },
        { input: '', outcome: 'blank', points: 0 },
        {
          input: 'Foca',
          outcome: 'scored',
          points: 25,
          match: { text: 'Foca', rarity: 'meteorite' },
        },
      ],
      'https://example.org/orbita/',
    );

    expect(text).toBe(
      '🚀 Astropalavra: cheguei a Saturno com 335 pts!\n🟠⚫🟢\nhttps://example.org/orbita/',
    );
  });
});
