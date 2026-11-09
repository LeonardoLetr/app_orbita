import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTestProgress } from '../../testing/test-providers';
import { CategoryRepository } from '../../core/data/category-repository';
import { Category } from '../../core/models/category';
import { GameService } from '../../core/services/game-service';
import { RANDOM } from '../../core/utils/random';
import { Game, MIN_REVEAL_MS, SHOW_LAUNCH, revealDelay } from './game';

describe('Game', () => {
  const categories: Category[] = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [{ text: `Resposta ${i}`, rarity: 'comet' }],
  }));

  let fixture: ComponentFixture<Game>;

  afterEach(() => fixture.destroy());

  async function render(showLaunch = false) {
    TestBed.configureTestingModule({
      imports: [Game],
      providers: [
        provideRouter([]),
        { provide: CategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: RANDOM, useValue: () => 0 },
        { provide: SHOW_LAUNCH, useValue: showLaunch },
        provideTestProgress(),
      ],
    });
    TestBed.inject(GameService).timerEnabled.set(false);

    fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** Text on the back of the question card, once it turned over. */
  function cardBack(element: HTMLElement): string {
    return element.querySelector('[data-showing="result"] .back-face')?.textContent ?? '';
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

    expect(cardBack(element)).toContain('Cometa');
    expect(cardBack(element)).toMatch(/\+50\s*pts/);
    expect(element.querySelector('header')?.textContent).toMatch(/50\s*pts/);
    expect(element.querySelector('[aria-live]')?.textContent).toContain('Cometa, mais 50 pontos.');
  });

  it('asks to try again when an answer is not in the base', async () => {
    const element = await render();

    await answer(element, 'Sereia');

    const input = element.querySelector<HTMLInputElement>('#answer')!;
    expect(element.querySelector('#retry-message')?.textContent).toContain('Tente outra');
    expect(input.value).toBe('Sereia');
    expect(input.hasAttribute('data-ready')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('h1')?.textContent).toContain('Categoria 0');
  });

  it('accepts the fixed answer after a retry', async () => {
    const element = await render();
    await answer(element, 'Sereia');

    await answer(element, 'resposta 0');

    expect(element.querySelector('#retry-message')?.textContent?.trim()).toBe('');
    expect(cardBack(element)).toContain('Cometa');
  });

  it('accepts a one-letter typo and says what it counted as', async () => {
    const element = await render();

    await answer(element, 'resposta 9');

    expect(cardBack(element)).toContain('Valeu como “Resposta 0”');
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
    // Still editable, so phone keyboards stay open, but marked as not taking answers.
    expect(input.readOnly).toBe(false);
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.hasAttribute('data-ready')).toBe(false);
    expect(input.placeholder).toBe('Aguarde…');
    expect(input.value).toBe('');
    // The keyboard goes away so the flight can be seen.
    expect(document.activeElement).not.toBe(input);
  });

  it('keeps the same answer field between categories', async () => {
    const element = await render();
    const input = element.querySelector('#answer');

    await answer(element, 'resposta 0');
    await new Promise((resolve) => setTimeout(resolve, revealDelay(0, 50) + 100));
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain('Categoria 1');
    expect(element.querySelector('#answer')).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  it('takes off from the ground before the first category', async () => {
    const element = await render(true);

    expect(element.querySelector('app-launch-layers')).not.toBeNull();
    expect(element.querySelector('.launch-countdown')?.textContent).toContain('3');
    expect(element.querySelector('app-question-card')?.classList).toContain('is-waiting');
    expect(element.querySelector('#answer')?.hasAttribute('data-ready')).toBe(false);
    expect(element.querySelector('form')?.hasAttribute('inert')).toBe(true);
  });

  it('ignores answers during the launch', async () => {
    const element = await render(true);

    await answer(element, 'resposta 0');

    expect(element.querySelector('header')?.textContent).toMatch(/0\s*pts/);
  });

  it('can skip the launch', async () => {
    const element = await render(true);
    const skip = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Pular decolagem'),
    )!;

    skip.click();
    await fixture.whenStable();

    expect(element.querySelector('app-launch-layers')).toBeNull();
    expect(element.querySelector('app-question-card')?.classList).not.toContain('is-waiting');
    expect(element.querySelector('#answer')?.hasAttribute('data-ready')).toBe(true);
  });

  it('keeps short results on screen for a minimum time', () => {
    expect(revealDelay(10, 10)).toBe(MIN_REVEAL_MS);
    expect(revealDelay(0, 30)).toBeGreaterThan(revealDelay(0, 10));
  });
});
