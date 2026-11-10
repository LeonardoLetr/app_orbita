import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { THEMES } from '../../core/data/themes';
import { ProgressService } from '../../core/services/progress-service';
import { provideTestProgress } from '../../testing/test-providers';
import { ThemePage } from './theme-page';

describe('ThemePage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ThemePage],
      providers: [provideRouter([]), provideTestProgress()],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(ThemePage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers every theme with its name, a taste of it and its address', () => {
    const links = [...render().querySelectorAll<HTMLAnchorElement>('ul a')];

    expect(links).toHaveLength(THEMES.length);
    expect(links[0].textContent).toContain('Natureza');
    expect(links[0].textContent).toContain('Bichos');
    expect(links.map((link) => link.getAttribute('href'))).toContain('/jogar/tema/natureza');
  });

  it('leads back to the home screen', () => {
    expect(render().querySelector('header a')?.getAttribute('href')).toBe('/');
  });

  it('shows the record of the mode once a round by theme was played', async () => {
    expect(render().textContent).not.toContain('recorde');

    await TestBed.inject(ProgressService).record({
      points: 210,
      planetId: 'jupiter',
      mode: 'theme',
      theme: 'world',
      answers: [],
    });

    expect(render().textContent).toContain('Seu recorde por tema: 210 pts');
  });
});
