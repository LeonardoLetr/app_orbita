import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CLASSIC_RULES } from '../../core/data/classic-rules';
import { GameMode, GameModeId } from '../../core/models/game-mode';
import { ProgressService } from '../../core/services/progress-service';
import { provideTestProgress } from '../../testing/test-providers';
import { ModePicker } from './mode-picker';

describe('ModePicker', () => {
  /** Stand-ins for the extra modes still to come. */
  const blitz: GameMode = {
    id: 'classic',
    name: 'Relâmpago',
    tagline: '60 segundos para responder o máximo que der.',
    slug: 'relampago',
    rules: CLASSIC_RULES,
  };
  const survival: GameMode = {
    ...blitz,
    id: 'survival' as GameModeId,
    name: 'Sobrevivência',
    tagline: 'Três vidas e uma viagem sem fim.',
    slug: 'sobrevivencia',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModePicker],
      providers: [provideRouter([]), provideTestProgress()],
    });
  });

  function render(modes: GameMode[]) {
    const fixture = TestBed.createComponent(ModePicker);
    fixture.componentRef.setInput('modes', modes);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers each mode with its name, its invitation and its address', () => {
    const links = render([blitz, survival]).querySelectorAll('a');

    expect(links).toHaveLength(2);
    expect(links[0].textContent).toContain('Relâmpago');
    expect(links[0].textContent).toContain('60 segundos');
    expect(links[0].getAttribute('href')).toBe('/jogar/relampago');
    expect(links[1].getAttribute('href')).toBe('/jogar/sobrevivencia');
  });

  it('shows the record only for modes already played', async () => {
    await TestBed.inject(ProgressService).record({
      mode: blitz.id,
      points: 120,
      planetId: 'mars',
      answers: [],
    });

    const links = render([blitz, survival]).querySelectorAll('a');

    expect(links[0].textContent).toContain('Recorde: 120 pts');
    expect(links[1].textContent).not.toContain('Recorde');
  });
});
