import { TestBed } from '@angular/core/testing';
import { AnswerResult } from '../../core/services/scoring-service';
import { RarityBadge } from './rarity-badge';

describe('RarityBadge', () => {
  function render(result: AnswerResult): string {
    const fixture = TestBed.createComponent(RarityBadge);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
  }

  it('shows the rarity and points of a scored answer', () => {
    const text = render({
      input: 'manati',
      outcome: 'scored',
      points: 50,
      match: { text: 'Peixe-boi', rarity: 'comet' },
    });

    expect(text).toBe('Cometa +50');
  });

  it('names the new levels', () => {
    expect(
      render({
        input: 'Foca',
        outcome: 'scored',
        points: 25,
        match: { text: 'Foca', rarity: 'meteorite' },
      }),
    ).toBe('Meteorito +25');
    expect(
      render({
        input: 'Coral',
        outcome: 'scored',
        points: 75,
        match: { text: 'Coral', rarity: 'pulsar' },
      }),
    ).toBe('Pulsar +75');
  });

  it('explains answers that scored zero', () => {
    expect(render({ input: 'Sereia', outcome: 'unknown', points: 0 })).toBe('Fora da base');
    expect(render({ input: '', outcome: 'blank', points: 0 })).toBe('Em branco');
    expect(render({ input: '', outcome: 'timeout', points: 0 })).toBe('Tempo esgotado');
  });
});
