import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BLITZ_SECONDS } from '../../core/data/blitz-rules';
import { BLITZ_MODE, SURVIVAL_MODE, THEMED_MODES } from '../../core/data/game-modes';
import { Category } from '../../core/models/category';
import { GameMode } from '../../core/models/game-mode';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { provideTestProgress } from '../../testing/test-providers';
import { Result } from './result';

describe('Result', () => {
  const sea: Category = {
    id: 'sea-animal',
    title: 'Animal que vive no mar',
    answers: [
      { text: 'Tubarão', rarity: 'satellite' },
      { text: 'Narval', rarity: 'supernova' },
      { text: 'Dugongo', rarity: 'supernova' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Result],
      providers: [provideRouter([]), provideTestProgress()],
    });
  });

  function render(entries: RoundEntry[], points: number, mode?: GameMode) {
    const fixture = TestBed.createComponent(Result);
    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('points', points);
    if (mode) {
      fixture.componentRef.setInput('mode', mode);
    }
    fixture.detectChanges();
    return fixture;
  }

  function answered(input: string): RoundEntry {
    return { category: sea, result: TestBed.inject(ScoringService).score(sea, input) };
  }

  it('shows the planet reached and the next goal', () => {
    const element = render([answered('Tubarão')], 50).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Lua');
    expect(element.textContent).toContain('Faltaram 50 pts para chegar a Marte.');
  });

  it('celebrates the end of the journey', () => {
    const element = render([answered('Narval')], 700).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Plutão');
    expect(element.textContent).toContain('ponto mais distante');
  });

  it('suggests rare answers other than the one given', () => {
    const element = render([answered('Narval')], 30).nativeElement as HTMLElement;
    const ideas = element.querySelector('li .ideas')?.textContent ?? '';

    expect(ideas).toContain('Dugongo');
    expect(ideas).not.toContain('Narval');
  });

  it('asks for a new round', () => {
    const fixture = render([answered('Tubarão')], 10);
    let asked = false;
    fixture.componentInstance.playAgain.subscribe(() => (asked = true));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();

    expect(asked).toBe(true);
  });

  it('celebrates a new record', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 30, planetId: 'moon', mode: 'classic', answers: [] });
    await progress.record({ points: 70, planetId: 'jupiter', mode: 'classic', answers: [] });

    const element = render([answered('Narval')], 70).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Novo recorde!');
    expect(element.textContent).toContain('Novo destino na coleção');
  });

  it('reminds the record when it was not beaten', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 90, planetId: 'saturn', mode: 'classic', answers: [] });
    await progress.record({ points: 90, planetId: 'saturn', mode: 'classic', answers: [] });

    const element = render([answered('Narval')], 90).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Seu recorde: 90 pts');
    expect(element.textContent).not.toContain('Novo destino');
  });

  it('charts the recent rounds once there is more than one', async () => {
    const progress = TestBed.inject(ProgressService);
    await progress.record({ points: 40, planetId: 'mars', mode: 'classic', answers: [] });

    let element = render([answered('Tubarão')], 40).nativeElement as HTMLElement;
    expect(element.querySelector('app-score-history')).toBeNull();

    await progress.record({ points: 80, planetId: 'mars', mode: 'classic', answers: [] });
    element = render([answered('Narval')], 80).nativeElement as HTMLElement;

    expect(element.querySelector('app-score-history')?.textContent).toContain('agora');
    expect(element.querySelector('app-score-history')?.textContent).toContain('média 60 pts');
  });

  it('shows the right spelling when a typo was forgiven', () => {
    const element = render([answered('Narvak')], 100).nativeElement as HTMLElement;

    expect(element.querySelector('ol li')?.textContent).toContain('Narvak');
    expect(element.querySelector('ol li')?.textContent).toContain('→ Narval');
  });

  it('shares the round with the system share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    try {
      const fixture = render([answered('Narval')], 100);
      shareButton(fixture.nativeElement).click();
      await fixture.whenStable();

      expect(share).toHaveBeenCalledWith({
        text: expect.stringContaining('cheguei a Marte com 100 pts'),
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('copies the round when the share sheet is not available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    try {
      const fixture = render([answered('Narval')], 100);
      shareButton(fixture.nativeElement).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('🟠'));
      expect(shareButton(fixture.nativeElement).textContent).toContain('Copiado!');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  function shareButton(element: HTMLElement): HTMLButtonElement {
    return [...element.querySelectorAll('button')].find((button) =>
      /Compartilhar|Copiado/.test(button.textContent ?? ''),
    )!;
  }

  describe('in an extra mode', () => {
    const blitz = BLITZ_MODE;

    it('says which mode was played', () => {
      const element = render([answered('Narval')], 100, blitz).nativeElement as HTMLElement;

      expect(element.textContent).toContain('Modo Relâmpago');
    });

    it('does not name the main mode', () => {
      const element = render([answered('Narval')], 100).nativeElement as HTMLElement;

      expect(element.textContent).not.toContain('Modo ');
    });

    it('leaves the rounds and the record of other modes out', async () => {
      const progress = TestBed.inject(ProgressService);
      await progress.record({ points: 300, planetId: 'saturn', mode: 'classic', answers: [] });
      await progress.record({ points: 320, planetId: 'saturn', mode: 'classic', answers: [] });
      await progress.record({ points: 100, planetId: 'mars', mode: blitz.id, answers: [] });

      const element = render([answered('Narval')], 100, blitz).nativeElement as HTMLElement;

      expect(element.querySelector('app-score-history')).toBeNull();
      expect(element.textContent).not.toContain('320');
    });
  });

  describe('after a round against a single clock', () => {
    it('says how many answers fit in it, leaving out the ones that scored nothing', () => {
      const entries = [answered('Narval'), answered(''), answered('Tubarão')];

      const element = render(entries, 110, BLITZ_MODE).nativeElement as HTMLElement;

      expect(element.textContent).toContain(`2 respostas em ${BLITZ_SECONDS} segundos`);
      expect(element.querySelectorAll('ol > li')).toHaveLength(3);
    });

    it('says it in the singular for one answer', () => {
      const element = render([answered('Narval')], 100, BLITZ_MODE).nativeElement as HTMLElement;

      expect(element.textContent).toContain(`1 resposta em ${BLITZ_SECONDS} segundos`);
    });

    it('does not count the answers of rounds with a clock per category', () => {
      const element = render([answered('Narval')], 100).nativeElement as HTMLElement;

      expect(element.textContent).not.toContain('segundos');
    });

    it('charts its rounds on a scale that follows the best one', async () => {
      const progress = TestBed.inject(ProgressService);
      await progress.record({ points: 450, planetId: 'uranus', mode: 'blitz', answers: [] });
      await progress.record({ points: 820, planetId: 'pluto', mode: 'blitz', answers: [] });

      const element = render([answered('Narval')], 820, BLITZ_MODE).nativeElement as HTMLElement;
      const chart = element.querySelector('app-score-history');

      expect(chart?.textContent).toContain('900 pts');
      expect(chart?.textContent).not.toContain('máx.');
    });

    function longRound() {
      const entries = Array.from({ length: 30 }, (_, i): RoundEntry => ({
        ...answered('Tubarão'),
        category: { ...sea, id: `c${i}` },
      }));
      return render(entries, 300, BLITZ_MODE);
    }

    it('folds a long list of answers until asked for all of it', () => {
      const fixture = longRound();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelectorAll('ol > li')).toHaveLength(10);

      const more = [...element.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Ver as 30 respostas'),
      )!;
      more.click();
      fixture.detectChanges();

      expect(element.querySelectorAll('ol > li')).toHaveLength(30);
      expect(element.textContent).not.toContain('Ver as 30 respostas');
    });

    it('brings the answers in one after the other, without making the last ones wait', () => {
      const fixture = longRound();
      const element = fixture.nativeElement as HTMLElement;
      [...element.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Ver as'))!
        .click();
      fixture.detectChanges();
      const delays = [...element.querySelectorAll<HTMLElement>('ol > li')].map((row) =>
        parseFloat(row.style.getPropertyValue('--delay')),
      );

      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[29]).toBe(delays[10]);
      expect(delays[29]).toBeLessThan(3.5);
    });

    it('shows a list that is only a little longer in full', () => {
      const entries = Array.from({ length: 12 }, (_, i): RoundEntry => ({
        ...answered('Tubarão'),
        category: { ...sea, id: `c${i}` },
      }));

      const element = render(entries, 120, BLITZ_MODE).nativeElement as HTMLElement;

      expect(element.querySelectorAll('ol > li')).toHaveLength(12);
    });
  });

  describe('after a round played with lives', () => {
    it('says how many answers came before the lives ran out', () => {
      const entries = [answered('Narval'), answered(''), answered('Tubarão'), answered('')];

      const element = render(entries, 110, SURVIVAL_MODE).nativeElement as HTMLElement;

      expect(element.textContent).toContain('Modo Sobrevivência');
      expect(element.textContent).toContain('2 respostas antes de perder as 3 vidas');
    });

    it('arrives at the stops beyond Pluto, and aims at the next one', () => {
      const element = render([answered('Narval')], 900, SURVIVAL_MODE).nativeElement as HTMLElement;

      expect(element.querySelector('h1')?.textContent).toContain('Éris');
      expect(element.textContent).toContain('Faltaram 100 pts para chegar à heliopausa.');
      expect(element.textContent).toContain('Curiosidade sobre Éris');
    });

    it('stops at Pluto in the modes of the classic route', () => {
      const element = render([answered('Narval')], 900, BLITZ_MODE).nativeElement as HTMLElement;

      expect(element.querySelector('h1')?.textContent).toContain('Plutão');
    });
  });

  describe('after a round played by theme', () => {
    const nature = THEMED_MODES.find((mode) => mode.theme?.id === 'nature')!;

    it('names the theme, not the mode', () => {
      const element = render([answered('Narval')], 100, nature).nativeElement as HTMLElement;

      expect(element.textContent).toContain('Tema Natureza');
      expect(element.textContent).not.toContain('Modo ');
    });

    it('offers to pick another theme', () => {
      const element = render([answered('Narval')], 100, nature).nativeElement as HTMLElement;

      expect(element.querySelector('a[href="/jogar/tema"]')?.textContent).toContain(
        'Escolher outro tema',
      );
    });

    it('does not offer themes after rounds of the other modes', () => {
      const element = render([answered('Narval')], 100, BLITZ_MODE).nativeElement as HTMLElement;

      expect(element.querySelector('a[href="/jogar/tema"]')).toBeNull();
    });

    it('shares the round with the theme in it', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { ...navigator, share });
      try {
        const fixture = render([answered('Narval')], 100, nature);
        shareButton(fixture.nativeElement).click();
        await fixture.whenStable();

        expect(share).toHaveBeenCalledWith({
          text: expect.stringContaining('Astropalavra (Tema Natureza)'),
        });
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  it('moves focus to the result heading', async () => {
    const fixture = render([answered('Tubarão')], 10);
    await fixture.whenStable();

    expect(document.activeElement?.id).toBe('result-title');
  });
});
