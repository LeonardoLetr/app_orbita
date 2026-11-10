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

  it('offers the blitz mode below the main button', () => {
    const element = render();
    const link = element.querySelector<HTMLAnchorElement>('a[href="/jogar/relampago"]');

    expect(element.textContent).toContain('Outros modos');
    expect(link?.textContent).toContain('Relâmpago');
    expect(link?.textContent).toContain('60 segundos');
  });

  it('keeps the record of each mode apart', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 75, planetId: 'moon', mode: 'classic', answers: [] });
    await progress.record({ points: 480, planetId: 'neptune', mode: 'blitz', answers: [] });

    const element = render();

    expect(
      element.querySelector('section[aria-labelledby="progress-title"] dl dd')?.textContent,
    ).toContain('75 pts');
    expect(element.querySelector('a[href="/jogar/relampago"]')?.textContent).toContain(
      'Recorde: 480 pts',
    );
  });

  it('shows no record of the main mode to someone who only played another one', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 480, planetId: 'neptune', mode: 'blitz', answers: [] });

    const record = render().querySelector('section[aria-labelledby="progress-title"] dl dd');

    expect(record?.textContent).not.toContain('pts');
    expect(record?.textContent).toContain('nenhuma partida no modo Clássico ainda');
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

  it('offers the survival mode next to the blitz mode', () => {
    const element = render();

    expect(element.querySelector('a[href="/jogar/sobrevivencia"]')?.textContent).toContain(
      'Sobrevivência',
    );
    expect(element.querySelector('app-mode-picker ul')?.classList).toContain('grid-cols-2');
  });

  it('counts only the stops of the classic route among the destinations reached', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 900, planetId: 'eris', mode: 'survival', answers: [] });
    await progress.record({ points: 50, planetId: 'moon', mode: 'classic', answers: [] });

    expect(render().textContent).toContain('Destinos alcançados: 1 de 8');
  });

  it('offers the rounds by theme', () => {
    const link = render().querySelector<HTMLAnchorElement>('a[href="/jogar/tema"]');

    expect(link?.textContent).toContain('Por tema');
  });

  it('shows the rank and the way to the next one', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 700, planetId: 'pluto', mode: 'classic', answers: [] });

    const element = render();
    const card = element.querySelector('section[aria-labelledby="progress-title"]')!;

    expect(card.textContent).toContain('Piloto');
    expect(card.textContent).toMatch(/700 XP · faltam 800 para Navegador/);
    expect(card.querySelector('app-rank-badge')).not.toBeNull();
    expect(card.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('20');
  });
});
