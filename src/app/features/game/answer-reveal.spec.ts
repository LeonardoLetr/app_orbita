import { TestBed } from '@angular/core/testing';
import { AnswerResult } from '../../core/services/scoring-service';
import { AnswerReveal } from './answer-reveal';

describe('AnswerReveal', () => {
  function render(result: AnswerResult): HTMLElement {
    const fixture = TestBed.createComponent(AnswerReveal);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('celebrates a rare answer with points and a star burst', () => {
    const element = render({
      input: 'Narval',
      outcome: 'scored',
      points: 30,
      match: { text: 'Narval', rarity: 'supernova' },
    });

    expect(element.textContent).toContain('+30');
    expect(element.textContent).toContain('Supernova!');
    expect(element.querySelector('app-star-burst')).not.toBeNull();
  });

  it('shows which answer a synonym counted as', () => {
    const element = render({
      input: 'manati',
      outcome: 'scored',
      points: 20,
      match: { text: 'Peixe-boi', rarity: 'comet' },
    });

    expect(element.textContent).toContain('Aceita como “Peixe-boi”');
  });

  it('keeps common answers simple', () => {
    const element = render({
      input: 'Banana',
      outcome: 'scored',
      points: 10,
      match: { text: 'Banana', rarity: 'satellite' },
    });

    expect(element.textContent).toContain('Satélite!');
    expect(element.querySelector('app-star-burst')).toBeNull();
  });

  it('explains answers that scored zero', () => {
    expect(render({ input: 'Sereia', outcome: 'unknown', points: 0 }).textContent).toContain(
      'Fora da base',
    );
    expect(render({ input: '', outcome: 'blank', points: 0 }).textContent).toContain('Pulou');
    expect(render({ input: '', outcome: 'timeout', points: 0 }).textContent).toContain(
      'Tempo esgotado',
    );
  });
});
