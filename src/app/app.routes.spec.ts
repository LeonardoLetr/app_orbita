import { routes } from './app.routes';
import { GAME_MODES, modeLink } from './core/data/game-modes';
import { Game } from './features/game/game';

describe('routes', () => {
  it('gives every game mode its own address, with the mode in the data', () => {
    for (const mode of GAME_MODES) {
      const route = routes.find((candidate) => `/${candidate.path}` === modeLink(mode));

      expect(route?.component, mode.id).toBe(Game);
      expect(route?.data?.['mode'], mode.id).toBe(mode);
    }
  });

  it('keeps the main mode at /jogar', () => {
    expect(routes.find((route) => route.path === 'jogar')?.data?.['mode']).toBe(GAME_MODES[0]);
  });
});
