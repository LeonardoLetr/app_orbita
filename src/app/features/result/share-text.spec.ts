import { PLANETS } from '../../core/data/planets';
import { shareText } from './share-text';

describe('shareText', () => {
  it('says the mode for rounds outside the main one', () => {
    const moon = PLANETS.find((planet) => planet.id === 'moon')!;

    expect(shareText(moon, 40, [], 'https://example.org/', 'Relâmpago')).toBe(
      '🚀 Astropalavra (Relâmpago): cheguei à Lua com 40 pts!\n\nhttps://example.org/',
    );
  });

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
