import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Category } from '../../core/models/category';
import { RoundEntry } from '../../core/services/game-service';
import { ScoringService } from '../../core/services/scoring-service';
import { Result } from './result';

describe('Result', () => {
  const sea: Category = {
    id: 'sea-animal',
    title: 'Animal que vive no mar',
    answers: [
      { text: 'Tubarão', rarity: 'satellite' },
      { text: 'Narval', rarity: 'supernova' },
      { text: 'Dugongo', rarity: 'supernova' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Result], providers: [provideRouter([])] });
  });

  function render(entries: RoundEntry[], points: number) {
    const fixture = TestBed.createComponent(Result);
    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('points', points);
    fixture.detectChanges();
    return fixture;
  }

  function answered(input: string): RoundEntry {
    return { category: sea, result: TestBed.inject(ScoringService).score(sea, input) };
  }

  it('shows the planet reached and the next goal', () => {
    const element = render([answered('Tubarão')], 30).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Lua');
    expect(element.textContent).toContain('Faltaram 10 pts para chegar a Marte.');
  });

  it('celebrates the end of the journey', () => {
    const element = render([answered('Narval')], 150).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Plutão');
    expect(element.textContent).toContain('ponto mais distante');
  });

  it('suggests rare answers other than the one given', () => {
    const element = render([answered('Narval')], 30).nativeElement as HTMLElement;
    const ideas = element.querySelector('li p.text-sm:last-child')?.textContent ?? '';

    expect(ideas).toContain('Dugongo');
    expect(ideas).not.toContain('Narval');
  });

  it('asks for a new round', () => {
    const fixture = render([answered('Tubarão')], 10);
    let asked = false;
    fixture.componentInstance.playAgain.subscribe(() => (asked = true));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();

    expect(asked).toBe(true);
  });
});
