import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameModeId } from '../../core/models/game-mode';
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

  function playRound(points: number, mode: GameModeId = 'classic') {
    return TestBed.inject(ProgressService).record({
      points,
      planetId: 'mars',
      mode,
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

  it('gives the record without naming the mode while only the main one was played', async () => {
    await playRound(45);
    await playRound(50);

    const element = (await render()).nativeElement as HTMLElement;

    expect(element.querySelector('h1 + p')?.textContent).toMatch(
      /2 partidas\s+· recorde de 50 pts/,
    );
    expect(element.querySelector('summary')?.textContent).not.toContain('Relâmpago');
  });

  it('names the mode of the rounds played outside the main one', async () => {
    await playRound(45);
    await playRound(480, 'blitz');

    const element = (await render()).nativeElement as HTMLElement;
    const rounds = element.querySelectorAll('summary');

    expect(rounds[0].textContent).toContain('· Relâmpago');
    expect(rounds[1].textContent).not.toContain('Relâmpago');
  });

  it('gives a record for each mode played', async () => {
    await playRound(45);
    await playRound(480, 'blitz');

    const summary = (await render()).nativeElement.querySelector('h1 + p') as HTMLElement;

    expect(summary.textContent).toMatch(/Recordes:\s+Clássico 45 pts ·\s+Relâmpago 480 pts/);
    expect(summary.textContent).not.toContain('recorde de');
  });

  it('names the mode of the only record when it is not the main one', async () => {
    await playRound(480, 'blitz');

    const summary = (await render()).nativeElement.querySelector('h1 + p') as HTMLElement;

    expect(summary.textContent).toMatch(/1 partida\s+Recorde:\s+Relâmpago 480 pts/);
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
