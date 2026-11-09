import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTestProgress } from '../../testing/test-providers';
import { CategoryRepository } from '../../core/data/category-repository';
import { Category } from '../../core/models/category';
import { GameService } from '../../core/services/game-service';
import { RANDOM } from '../../core/utils/random';
import { Game, MIN_REVEAL_MS, revealDelay } from './game';

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
        provideTestProgress(),
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

    expect(element.querySelector('.badge')?.textContent).toContain('Cometa +50');
    expect(element.querySelector('header')?.textContent).toMatch(/50\s*pts/);
    expect(element.querySelector('[aria-live]')?.textContent).toContain('Cometa, mais 50 pontos.');
  });

  it('asks to try again when an answer is not in the base', async () => {
    const element = await render();

    await answer(element, 'Sereia');

    const input = element.querySelector<HTMLInputElement>('#answer')!;
    expect(element.querySelector('#retry-message')?.textContent).toContain('Tente outra');
    expect(input.value).toBe('Sereia');
    expect(input.readOnly).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('h1')?.textContent).toContain('Categoria 0');
  });

  it('accepts the fixed answer after a retry', async () => {
    const element = await render();
    await answer(element, 'Sereia');

    await answer(element, 'resposta 0');

    expect(element.querySelector('#retry-message')?.textContent?.trim()).toBe('');
    expect(element.querySelector('.badge')?.textContent).toContain('Cometa +50');
  });

  it('accepts a one-letter typo and says what it counted as', async () => {
    const element = await render();

    await answer(element, 'resposta 9');

    expect(element.querySelector('.badge')?.textContent).toContain('Cometa +50');
    expect(element.querySelector('[aria-live=polite]')?.textContent).toContain(
      'Valeu como Resposta 0.',
    );
  });

  it('shows the journey scene and the next destination while playing', async () => {
    const element = await render();

    expect(element.querySelector('app-journey-scene')).not.toBeNull();
    expect(element.textContent).toMatch(/Próximo:\s*Lua\s*· faltam\s*40 pts/);
  });

  it('waits while the rocket flies before the next category', async () => {
    const element = await render();

    await answer(element, 'resposta 0');

    const input = element.querySelector<HTMLInputElement>('#answer')!;
    expect(input.readOnly).toBe(true);
    expect(input.placeholder).toBe('Aguarde…');
    expect(input.value).toBe('');
  });

  it('keeps the same answer field between categories', async () => {
    const element = await render();
    const input = element.querySelector('#answer');

    await answer(element, 'resposta 0');
    await new Promise((resolve) => setTimeout(resolve, revealDelay(0, 50) + 100));
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain('Categoria 1');
    expect(element.querySelector('#answer')).toBe(input);
  });

  it('keeps short results on screen for a minimum time', () => {
    expect(revealDelay(10, 10)).toBe(MIN_REVEAL_MS);
    expect(revealDelay(0, 30)).toBeGreaterThan(revealDelay(0, 10));
  });
});
