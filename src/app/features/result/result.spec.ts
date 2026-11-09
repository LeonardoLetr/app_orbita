import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Category } from '../../core/models/category';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { provideTestProgress } from '../../testing/test-providers';
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
    TestBed.configureTestingModule({
      imports: [Result],
      providers: [provideRouter([]), provideTestProgress()],
    });
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
    const element = render([answered('Tubarão')], 50).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Lua');
    expect(element.textContent).toContain('Faltaram 50 pts para chegar a Marte.');
  });

  it('celebrates the end of the journey', () => {
    const element = render([answered('Narval')], 700).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Plutão');
    expect(element.textContent).toContain('ponto mais distante');
  });

  it('suggests rare answers other than the one given', () => {
    const element = render([answered('Narval')], 30).nativeElement as HTMLElement;
    const ideas = element.querySelector('li .ideas')?.textContent ?? '';

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

  it('celebrates a new record', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 30, planetId: 'moon', timerEnabled: true, answers: [] });
    await progress.record({ points: 70, planetId: 'jupiter', timerEnabled: true, answers: [] });

    const element = render([answered('Narval')], 70).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Novo recorde!');
    expect(element.textContent).toContain('Novo destino na coleção');
  });

  it('reminds the record when it was not beaten', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 90, planetId: 'saturn', timerEnabled: true, answers: [] });
    await progress.record({ points: 90, planetId: 'saturn', timerEnabled: true, answers: [] });

    const element = render([answered('Narval')], 90).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Seu recorde: 90 pts');
    expect(element.textContent).not.toContain('Novo destino');
  });

  it('charts the recent rounds once there is more than one', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 40, planetId: 'mars', timerEnabled: true, answers: [] });

    let element = render([answered('Tubarão')], 40).nativeElement as HTMLElement;
    expect(element.querySelector('app-score-history')).toBeNull();

    await progress.record({ points: 80, planetId: 'mars', timerEnabled: true, answers: [] });
    element = render([answered('Narval')], 80).nativeElement as HTMLElement;

    expect(element.querySelector('app-score-history')?.textContent).toContain('agora');
    expect(element.querySelector('app-score-history')?.textContent).toContain('média 60 pts');
  });

  it('shows the right spelling when a typo was forgiven', () => {
    const element = render([answered('Narvak')], 100).nativeElement as HTMLElement;

    expect(element.querySelector('ol li')?.textContent).toContain('Narvak');
    expect(element.querySelector('ol li')?.textContent).toContain('→ Narval');
  });

  it('moves focus to the result heading', async () => {
    const fixture = render([answered('Tubarão')], 10);
    await fixture.whenStable();

    expect(document.activeElement?.id).toBe('result-title');
  });
});
