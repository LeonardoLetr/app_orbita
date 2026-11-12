import { RoundRecord } from '../models/progress';
import { countDiscoveries, fromRounds, newDiscoveries, withRound } from './discoveries';

function round(playedAt: string, ...answers: [category: string, text?: string][]) {
  return {
    playedAt,
    answers: answers.map(([categoryId, text]) => ({
      categoryId,
      categoryTitle: categoryId,
      result: text
        ? {
            input: text.toLowerCase(),
            outcome: 'scored' as const,
            points: 50,
            match: { text, rarity: 'comet' as const },
          }
        : { input: '', outcome: 'blank' as const, points: 0 },
    })),
  } as RoundRecord;
}

describe('discoveries', () => {
  it('writes in the answers that scored, by their official text', () => {
    const logbook = withRound({}, round('2026-11-01', ['sea', 'Narval'], ['fruit']));

    expect(logbook).toEqual({ sea: { narval: { first: '2026-11-01', times: 1 } } });
  });

  it('counts an answer given again and keeps the first date', () => {
    const first = withRound({}, round('2026-11-01', ['sea', 'Narval']));
    const again = withRound(first, round('2026-11-05', ['sea', 'Narval'], ['sea', 'Peixe-boi']));

    expect(again['sea']['narval']).toEqual({ first: '2026-11-01', times: 2 });
    expect(again['sea']['peixe boi']).toEqual({ first: '2026-11-05', times: 1 });
    expect(countDiscoveries(again)).toBe(2);
  });

  it('does not change the logbook it was given', () => {
    const first = withRound({}, round('2026-11-01', ['sea', 'Narval']));
    withRound(first, round('2026-11-05', ['sea', 'Narval']));

    expect(first['sea']['narval'].times).toBe(1);
  });

  it('tells what a round brings for the first time, each answer once', () => {
    const logbook = withRound({}, round('2026-11-01', ['sea', 'Narval']));
    const next = round('2026-11-05', ['sea', 'Narval'], ['sea', 'Foca'], ['sea', 'Foca']);

    expect(newDiscoveries(logbook, next)).toEqual([{ categoryId: 'sea', key: 'foca' }]);
  });

  it('is rebuilt from saved rounds, the oldest giving the first date', () => {
    const logbook = fromRounds([
      round('2026-11-05', ['sea', 'Narval']),
      round('2026-11-01', ['sea', 'Narval']),
    ]);

    expect(logbook['sea']['narval']).toEqual({ first: '2026-11-01', times: 2 });
  });
});
