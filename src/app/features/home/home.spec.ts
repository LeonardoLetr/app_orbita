import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryRepository } from '../../core/data/category-repository';
import { GameService } from '../../core/services/game-service';
import { PreferencesService } from '../../core/services/preferences-service';
import { ProgressService } from '../../core/services/progress-service';
import { provideTestProgress } from '../../testing/test-providers';
import { Home } from './home';

describe('Home', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: CategoryRepository, useValue: { getAll: () => Promise.resolve([]) } },
        provideTestProgress(),
      ],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the game title', () => {
    expect(render().querySelector('h1')?.textContent).toContain('Astropalavra');
  });

  it('links to a new round', () => {
    const link = render().querySelector<HTMLAnchorElement>('a[href="/jogar"]');

    expect(link?.textContent).toContain('Começar partida');
  });

  it('turns the timer off and on', () => {
    const element = render();
    const game = TestBed.inject(GameService);
    const toggle = element.querySelector<HTMLInputElement>('input[role="switch"]')!;

    expect(toggle.checked).toBe(true);

    toggle.click();
    expect(game.timerEnabled()).toBe(false);

    toggle.click();
    expect(game.timerEnabled()).toBe(true);
  });

  it('hides the progress before the first round', () => {
    expect(render().textContent).not.toContain('Recorde');
  });

  it('shows the record and the planets reached', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 30, planetId: 'moon', timerEnabled: true, answers: [] });
    await progress.record({ points: 75, planetId: 'jupiter', timerEnabled: false, answers: [] });

    const element = render();

    expect(element.textContent).toContain('75 pts');
    expect(element.textContent).toContain('Destinos alcançados: 2 de 8');
    expect(element.querySelectorAll('app-planet-art.grayscale')).toHaveLength(6);
    expect(element.querySelector('a[href="/historico"]')).not.toBeNull();
  });

  it('turns music on from the home screen', () => {
    const element = render();
    const switches = element.querySelectorAll<HTMLInputElement>('input[role="switch"]');

    expect(switches[2].checked).toBe(false);
    switches[2].click();

    expect(TestBed.inject(PreferencesService).musicEnabled()).toBe(true);
  });

  it('turns sound on from the home screen', () => {
    const element = render();
    const switches = element.querySelectorAll<HTMLInputElement>('input[role="switch"]');

    expect(switches[1].checked).toBe(false);
    switches[1].click();

    expect(TestBed.inject(PreferencesService).soundEnabled()).toBe(true);
  });
});
