import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryRepository } from '../../core/data/category-repository';
import { GameService } from '../../core/services/game-service';
import { provideTestProgress } from '../../testing/test-providers';
import { Home } from './home';

describe('Home', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: CategoryRepository, useValue: { getAll: () => Promise.resolve([]) } },
        provideTestProgress(),
      ],
    });
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the game title', () => {
    expect(render().querySelector('h1')?.textContent).toContain('Órbita');
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
});
