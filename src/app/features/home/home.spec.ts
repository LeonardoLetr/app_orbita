import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryRepository } from '../../core/data/category-repository';
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

  it('has no switch to turn the timer off', () => {
    expect(render().textContent).not.toContain('Cronômetro');
  });

  it('hides the progress before the first round', () => {
    expect(render().textContent).not.toContain('Recorde');
  });

  it('shows the record and the planets reached', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 30, planetId: 'moon', mode: 'classic', answers: [] });
    await progress.record({ points: 75, planetId: 'jupiter', mode: 'classic', answers: [] });

    const element = render();

    expect(element.textContent).toContain('75 pts');
    expect(element.textContent).toContain('Destinos alcançados: 2 de 8');
    expect(element.querySelectorAll('app-planet-art.brightness-0')).toHaveLength(6);
    expect(element.querySelector('a[href="/historico"]')).not.toBeNull();
  });

  it('turns music on from the home screen', () => {
    const element = render();
    const switches = element.querySelectorAll<HTMLInputElement>('input[role="switch"]');

    expect(switches[1].checked).toBe(false);
    switches[1].click();

    expect(TestBed.inject(PreferencesService).musicEnabled()).toBe(true);
  });

  it('turns sound on from the home screen', () => {
    const element = render();
    const switches = element.querySelectorAll<HTMLInputElement>('input[role="switch"]');

    expect(switches[0].checked).toBe(false);
    switches[0].click();

    expect(TestBed.inject(PreferencesService).soundEnabled()).toBe(true);
  });
});
