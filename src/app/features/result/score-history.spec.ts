import { TestBed } from '@angular/core/testing';
import { RoundRecord } from '../../core/models/progress';
import { ScoreHistory } from './score-history';

function round(id: string, points: number): RoundRecord {
  return {
    id,
    playedAt: '2026-11-08T21:00:00.000Z',
    points,
    planetId: 'moon',
    timerEnabled: true,
    answers: [],
  };
}

describe('ScoreHistory', () => {
  function render(rounds: RoundRecord[], currentId?: string) {
    const fixture = TestBed.createComponent(ScoreHistory);
    fixture.componentRef.setInput('rounds', rounds);
    fixture.componentRef.setInput('currentId', currentId);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  // Newest first, as the progress service keeps them.
  const rounds = [round('c', 350), round('b', 140), round('a', 210)];

  it('draws the rounds from oldest to newest on a 0 to 700 scale', () => {
    const bars = [...render(rounds, 'c').querySelectorAll<HTMLElement>('.bar')];

    expect(bars.map((bar) => bar.style.height)).toEqual(['30%', '20%', '50%']);
  });

  it('highlights the round just played and labels it', () => {
    const element = render(rounds, 'c');
    const bars = element.querySelectorAll('.bar');

    expect(bars[2].className).toContain('bg-[#c78600]');
    expect(bars[0].className).toContain('bg-[#5b628f]');
    expect(element.textContent).toContain('agora');
    expect(element.textContent).toContain('350');
  });

  it('shows the average', () => {
    expect(render(rounds, 'c').querySelector('figcaption')?.textContent).toContain('média 233 pts');
  });

  it('has a table with the same numbers for screen readers', () => {
    const rows = render(rounds, 'c').querySelectorAll('tbody tr');

    expect(rows).toHaveLength(3);
    expect(rows[2].textContent).toContain('Esta partida');
    expect(rows[2].textContent).toContain('350');
  });
});
