import { routes } from './app.routes';
import { GAME_MODES, THEMED_MODES, THEME_MODE, modeLink } from './core/data/game-modes';
import { Game } from './features/game/game';
import { ThemePage } from './features/themes/theme-page';

describe('routes', () => {
  const routeOf = (link: string) => routes.find((candidate) => `/${candidate.path}` === link);

  it('gives every game mode its own address, with the mode in the data', () => {
    for (const mode of GAME_MODES.filter((candidate) => candidate !== THEME_MODE)) {
      const route = routeOf(modeLink(mode));

      expect(route?.component, mode.id).toBe(Game);
      expect(route?.data?.['mode'], mode.id).toBe(mode);
    }
  });

  it('keeps the main mode at /jogar', () => {
    expect(routes.find((route) => route.path === 'jogar')?.data?.['mode']).toBe(GAME_MODES[0]);
  });

  it('opens the theme mode on the choice of theme', () => {
    expect(routeOf('/jogar/tema')?.component).toBe(ThemePage);
  });

  it('gives every theme its own game screen', () => {
    expect(THEMED_MODES.length).toBeGreaterThan(0);
    for (const mode of THEMED_MODES) {
      const route = routeOf(modeLink(mode));

      expect(route?.component, mode.theme?.id).toBe(Game);
      expect(route?.data?.['mode'], mode.theme?.id).toBe(mode);
      expect(route?.title, mode.theme?.id).toContain(mode.theme?.name);
    }
    expect(routeOf('/jogar/tema/natureza')).toBeDefined();
  });
});
