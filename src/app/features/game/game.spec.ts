import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryRepository } from '../../core/data/category-repository';
import { Category } from '../../core/models/category';
import { GameService } from '../../core/services/game-service';
import { RANDOM } from '../../core/utils/random';
import { Game } from './game';

describe('Game', () => {
  const categories: Category[] = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [{ text: `Resposta ${i}`, rarity: 'comet' }],
  }));

  let fixture: ComponentFixture<Game>;

  afterEach(() => fixture.destroy());

  async function render() {
    TestBed.configureTestingModule({
      imports: [Game],
      providers: [
        provideRouter([]),
        { provide: CategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    TestBed.inject(GameService).timerEnabled.set(false);

    fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  async function answer(element: HTMLElement, text: string) {
    const input = element.querySelector<HTMLInputElement>('#answer')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('shows the first drawn category', async () => {
    const element = await render();

    expect(element.querySelector('h1')?.textContent).toContain('Categoria 0');
    expect(element.textContent).toContain('Categoria 1 de 5');
  });

  it('reveals the score right after answering', async () => {
    const element = await render();

    await answer(element, 'resposta 0');

    expect(element.textContent).toContain('Cometa +20');
    expect(element.textContent).toContain('20 pts');
  });

  it('shows when an answer is not in the base', async () => {
    const element = await render();

    await answer(element, 'Sereia');

    expect(element.textContent).toContain('Fora da base');
  });
});
