import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgressService } from '../../core/services/progress-service';
import { provideTestProgress } from '../../testing/test-providers';
import { HistoryPage } from './history-page';

describe('HistoryPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [provideRouter([]), provideTestProgress()],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();
    return fixture;
  }

  function playRound(points: number) {
    return TestBed.inject(ProgressService).record({
      points,
      planetId: 'mars',
      mode: 'classic',
      answers: [
        {
          categoryId: 'fruit',
          categoryTitle: 'Fruta',
          result: {
            input: 'Lichia',
            outcome: 'scored',
            points: 30,
            match: { text: 'Lichia', rarity: 'supernova' },
          },
        },
      ],
    });
  }

  it('invites to play when there is no history', async () => {
    const element = (await render()).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Nenhuma partida por aqui ainda.');
  });

  it('lists past rounds with their answers', async () => {
    await playRound(45);
    await playRound(50);

    const element = (await render()).nativeElement as HTMLElement;
    const rounds = element.querySelectorAll('details');

    expect(rounds).toHaveLength(2);
    expect(rounds[0].textContent).toContain('50 pts');
    expect(rounds[0].textContent).toContain('Marte');
    expect(rounds[0].textContent).toContain('Supernova +30');
    expect(element.textContent).toContain('2 partidas');
  });

  it('clears the history after confirming', async () => {
    await playRound(45);
    const fixture = await render();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(ProgressService).totalRounds()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nenhuma partida');
  });

  it('keeps the history when not confirmed', async () => {
    await playRound(45);
    const fixture = await render();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(ProgressService).totalRounds()).toBe(1);
  });
});
