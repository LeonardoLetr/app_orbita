import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CLASSIC_MODE, SURVIVAL_MODE } from '../../core/data/game-modes';
import { GameMode } from '../../core/models/game-mode';
import { provideTestProgress } from '../../testing/test-providers';
import { CategoryRepository } from '../../core/data/category-repository';
import { Category } from '../../core/models/category';
import { GameService } from '../../core/services/game-service';
import { SoundService } from '../../core/services/sound-service';
import { RANDOM } from '../../core/utils/random';
import { Game, MIN_REVEAL_MS, QUICK_REVEAL_MS, SHOW_LAUNCH, revealDelay } from './game';

describe('Game', () => {
  const categories: Category[] = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    title: `Categoria ${i}`,
    answers: [{ text: `Resposta ${i}`, rarity: 'comet' }],
  }));

  let fixture: ComponentFixture<unknown>;

  afterEach(() => fixture.destroy());

  function configure(showLaunch = false, routes: Routes = []) {
    TestBed.configureTestingModule({
      imports: [Game],
      providers: [
        provideRouter(routes),
        { provide: CategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: RANDOM, useValue: () => 0 },
        { provide: SHOW_LAUNCH, useValue: showLaunch },
        provideTestProgress(),
      ],
    });
    TestBed.inject(GameService).timerEnabled.set(false);
  }

  async function render(showLaunch = false) {
    configure(showLaunch);
    fixture = TestBed.createComponent(Game);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** Renders the game at the address of a mode, the way the router does. */
  async function renderMode(mode: GameMode) {
    configure(false, [{ path: 'jogar/modo', component: Game, data: { mode } }]);
    const harness = await RouterTestingHarness.create('/jogar/modo');
    fixture = harness.fixture;
    await fixture.whenStable();
    return harness.routeNativeElement as HTMLElement;
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

  it('plays the classic mode at an address without one', async () => {
    await render();

    expect(TestBed.inject(GameService).mode()).toBe(CLASSIC_MODE);
  });

  it('plays the mode of its address', async () => {
    const short: GameMode = {
      ...CLASSIC_MODE,
      name: 'Curto',
      slug: 'curto',
      rules: { ...CLASSIC_MODE.rules, pickCategories: (all) => all.slice(0, 2) },
    };

    const element = await renderMode(short);

    expect(TestBed.inject(GameService).mode()).toBe(short);
    expect(element.textContent).toContain('Categoria 1 de 2');
  });

  it('keeps the keyboard and moves on sooner in quick rounds', async () => {
    const quick: GameMode = {
      ...CLASSIC_MODE,
      name: 'Rápido',
      slug: 'rapido',
      rules: { ...CLASSIC_MODE.rules, pace: 'quick' },
    };
    const element = await renderMode(quick);
    const input = element.querySelector<HTMLInputElement>('#answer')!;

    await answer(element, 'resposta 0');
    expect(document.activeElement).toBe(input);

    await new Promise((resolve) => setTimeout(resolve, revealDelay(0, 50, 'quick') + 100));
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Categoria 1');
  });

  describe('against a single clock for the whole round', () => {
    const blitz: GameMode = {
      ...CLASSIC_MODE,
      name: 'Relâmpago',
      slug: 'relampago',
      rules: {
        clock: { scope: 'round', seconds: 60 },
        pace: 'quick',
        pickCategories: (all) => [...all],
      },
    };
    /** Long enough for a quick result to give way to the next category. */
    const REVEAL = revealDelay(0, 600, 'quick') + 100;

    // Only the clock is faked: the screen still renders and reveals in real time.
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }));
    afterEach(() => {
      fixture.destroy();
      vi.useRealTimers();
    });

    async function renderClocked(mode = blitz) {
      configure(false, [{ path: 'jogar/modo', component: Game, data: { mode } }]);
      TestBed.inject(GameService).timerEnabled.set(true);
      const harness = await RouterTestingHarness.create('/jogar/modo');
      fixture = harness.fixture;
      await fixture.whenStable();
      return harness.routeNativeElement as HTMLElement;
    }

    async function pass(ms: number) {
      vi.advanceTimersByTime(ms);
      await fixture.whenStable();
    }

    async function afterReveal() {
      await new Promise((resolve) => setTimeout(resolve, REVEAL));
      await fixture.whenStable();
    }

    function secondsLeft(element: HTMLElement): string | undefined {
      return element.querySelector('app-timer-ring')?.textContent?.trim();
    }

    it('counts the answers that scored instead of the categories', async () => {
      const element = await renderClocked();
      const header = element.querySelector('header')!;
      expect(header.textContent).toContain('0 respostas');
      expect(header.textContent).not.toContain('Categoria');

      await answer(element, 'resposta 0');
      expect(header.textContent).toContain('1 resposta');
      expect(header.textContent).not.toContain('1 respostas');

      await afterReveal();
      await answer(element, '');
      expect(header.textContent).toContain('1 resposta');
    });

    it('starts the clock once and stops it while a result is shown', async () => {
      const element = await renderClocked();
      expect(secondsLeft(element)).toBe('60');

      await pass(10_000);
      expect(secondsLeft(element)).toBe('50');

      await answer(element, 'resposta 0');
      await pass(30_000);
      expect(secondsLeft(element)).toBe('50');

      await afterReveal();
      expect(element.querySelector('h1')?.textContent).toContain('Categoria 1');
      expect(secondsLeft(element)).toBe('50');

      await pass(5_000);
      expect(secondsLeft(element)).toBe('45');
    });

    it('keeps the clock running while the player tries again', async () => {
      const element = await renderClocked();

      await answer(element, 'Sereia');
      await pass(5_000);

      expect(element.querySelector('#retry-message')?.textContent).toContain('Tente outra');
      expect(secondsLeft(element)).toBe('55');
    });

    it('ends the round when the clock runs out, scoring what is typed', async () => {
      const element = await renderClocked();
      await answer(element, 'resposta 0');
      await afterReveal();
      const input = element.querySelector<HTMLInputElement>('#answer')!;
      input.value = 'resposta 1';
      input.dispatchEvent(new Event('input'));

      await pass(60_000);
      expect(cardBack(element)).toContain('Cometa');
      expect(element.querySelector('[aria-live=polite]')?.textContent).toBe(
        'Cometa, mais 50 pontos. Tempo esgotado.',
      );

      await afterReveal();
      const game = TestBed.inject(GameService);
      expect(game.status()).toBe('finished');
      expect(game.totalPoints()).toBe(100);
      // The three categories that were never asked are left out.
      expect(game.entries().map((entry) => entry.category.id)).toEqual(['c0', 'c1']);
      expect(element.querySelector('#result-title')).not.toBeNull();
    });

    it('says the time ran out when nothing was typed', async () => {
      const element = await renderClocked();

      await pass(60_000);

      expect(cardBack(element)).toContain('Tempo esgotado');
      await afterReveal();
      expect(TestBed.inject(GameService).entries()).toHaveLength(1);
      expect(element.querySelector('#result-title')).not.toBeNull();
    });

    it('says the time ran out, not that the text left typed is outside the list', async () => {
      const element = await renderClocked();
      const input = element.querySelector<HTMLInputElement>('#answer')!;
      input.value = 'Sereia';
      input.dispatchEvent(new Event('input'));

      await pass(60_000);

      expect(cardBack(element)).toContain('Tempo esgotado');
      expect(cardBack(element)).not.toContain('Fora da lista');
      expect(element.querySelector('[aria-live=polite]')?.textContent).toBe('Tempo esgotado.');
      // The history still keeps what was typed.
      expect(TestBed.inject(GameService).current()?.result?.outcome).toBe('unknown');
    });

    it('asks nothing else when an answer comes in right as the clock runs out', async () => {
      const element = await renderClocked();
      await pass(59_950);
      // The last instant, between two updates of the clock.
      vi.setSystemTime(Date.now() + 80);

      await answer(element, 'resposta 0');
      expect(cardBack(element)).toContain('Cometa');

      await afterReveal();
      const game = TestBed.inject(GameService);
      expect(game.status()).toBe('finished');
      expect(game.entries()).toHaveLength(1);
      expect(game.totalPoints()).toBe(50);
    });

    it('ends when the categories run out before the clock', async () => {
      const element = await renderClocked({
        ...blitz,
        rules: { ...blitz.rules, pickCategories: (all) => all.slice(0, 2) },
      });

      await answer(element, '');
      await afterReveal();
      await answer(element, '');
      await afterReveal();

      expect(TestBed.inject(GameService).status()).toBe('finished');
      expect(element.querySelector('#result-title')).not.toBeNull();
    });

    it('gives later categories the time their position asks for', async () => {
      const element = await renderClocked({
        ...blitz,
        rules: {
          ...blitz.rules,
          clock: { scope: 'category', seconds: 30, secondsAt: (index) => (index === 0 ? 30 : 12) },
        },
      });
      expect(secondsLeft(element)).toBe('30');

      await answer(element, 'resposta 0');
      await afterReveal();

      expect(secondsLeft(element)).toBe('12');
    });

    function countTicks() {
      const play = vi.spyOn(TestBed.inject(SoundService), 'play');
      return () => play.mock.calls.filter(([effect]) => effect === 'tick').length;
    }

    it('counts the last five seconds out loud', async () => {
      await renderClocked();
      const ticks = countTicks();

      await pass(54_000);
      expect(ticks()).toBe(0);

      for (let second = 1; second <= 5; second++) {
        await pass(1_000);
        expect(ticks()).toBe(second);
      }
    });

    it('stays silent when each category has its own clock', async () => {
      await renderClocked({ ...blitz, rules: CLASSIC_MODE.rules });
      const ticks = countTicks();

      for (let second = 0; second < 29; second++) {
        await pass(1_000);
      }

      expect(ticks()).toBe(0);
    });
  });

  describe('with lives', () => {
    const lit = (element: HTMLElement) => element.querySelectorAll('header .life[data-lit]');
    const sendButton = (element: HTMLElement) =>
      element.querySelector<HTMLButtonElement>('form button[type=submit]')!;

    it('shows the category number with no end, and the lives', async () => {
      const element = await renderMode(SURVIVAL_MODE);
      const header = element.querySelector('header')!;

      expect(header.textContent).toContain('Categoria 1');
      expect(header.textContent).not.toContain('Categoria 1 de');
      expect(header.querySelectorAll('.life')).toHaveLength(3);
      expect(lit(element)).toHaveLength(3);
      expect(header.textContent).toContain('Vidas: 3 de 3');
    });

    it('warns that skipping costs a life, only while nothing is typed', async () => {
      const element = await renderMode(SURVIVAL_MODE);
      expect(sendButton(element).textContent).toMatch(/Pular\s*−1 vida/);

      const input = element.querySelector<HTMLInputElement>('#answer')!;
      input.value = 'algo';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      expect(sendButton(element).textContent?.trim()).toBe('Enviar');
    });

    it('does not mention lives in the modes without them', async () => {
      const element = await render();

      expect(sendButton(element).textContent?.trim()).toBe('Pular');
      expect(element.querySelector('.life')).toBeNull();
    });

    it('takes a life, blinks and says so when a category is skipped', async () => {
      const element = await renderMode(SURVIVAL_MODE);

      await answer(element, '');

      expect(lit(element)).toHaveLength(2);
      expect(element.querySelector('.life-flash')).not.toBeNull();
      expect(element.querySelector('[aria-live=polite]')?.textContent).toBe(
        'Categoria pulada. Menos uma vida: restam 2.',
      );
    });

    it('keeps the lives for an answer that scores', async () => {
      const element = await renderMode(SURVIVAL_MODE);

      await answer(element, 'resposta 0');

      expect(lit(element)).toHaveLength(3);
      expect(element.querySelector('.life-flash')).toBeNull();
    });

    it('shows the next stops of the longer route', async () => {
      const element = await renderMode(SURVIVAL_MODE);

      expect(element.querySelectorAll('app-journey-scene .stop')).toHaveLength(12);
      expect(element.querySelector('app-journey-scene')?.textContent).toContain('Proxima Centauri');
    });
  });

  it('keeps short results on screen for a minimum time', () => {
    expect(revealDelay(10, 10)).toBe(MIN_REVEAL_MS);
    expect(revealDelay(0, 30)).toBeGreaterThan(revealDelay(0, 10));
  });

  it('shows results for a shorter time in quick rounds', () => {
    expect(revealDelay(10, 10, 'quick')).toBe(QUICK_REVEAL_MS);
    expect(revealDelay(0, 600, 'quick')).toBeGreaterThan(QUICK_REVEAL_MS);
    expect(revealDelay(0, 600, 'quick')).toBeLessThan(MIN_REVEAL_MS);
  });
});
