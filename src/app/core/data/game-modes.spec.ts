import { GameMode, GameModeId } from '../models/game-mode';
import { BLITZ_SECONDS } from './blitz-rules';
import { CLASSIC_RULES } from './classic-rules';
import {
  BLITZ_MODE,
  CLASSIC_MODE,
  GAME_MODES,
  isGameModeId,
  isMainMode,
  modeLabel,
  modeLink,
} from './game-modes';

describe('game modes', () => {
  /** A stand-in for a mode that is not in the game. */
  const extra: GameMode = {
    id: 'extra' as GameModeId,
    name: 'Extra',
    tagline: 'Outro jeito de jogar.',
    slug: 'extra',
    rules: CLASSIC_RULES,
  };
  const modes = [CLASSIC_MODE, extra];

  it('has the classic mode first, with unique ids and addresses', () => {
    expect(GAME_MODES[0]).toBe(CLASSIC_MODE);
    expect(new Set(GAME_MODES.map((mode) => mode.id)).size).toBe(GAME_MODES.length);
    expect(new Set(GAME_MODES.map(modeLink)).size).toBe(GAME_MODES.length);
    expect(GAME_MODES.filter(isMainMode)).toEqual([CLASSIC_MODE]);
  });

  it('gives each mode its address', () => {
    expect(modeLink(CLASSIC_MODE)).toBe('/jogar');
    expect(modeLink(BLITZ_MODE)).toBe('/jogar/relampago');
    expect(modeLink(extra)).toBe('/jogar/extra');
  });

  it('knows which ids exist', () => {
    expect(isGameModeId('classic')).toBe(true);
    expect(isGameModeId('blitz')).toBe(true);
    expect(isGameModeId('extra')).toBe(false);
    expect(isGameModeId('extra', modes)).toBe(true);
    expect(isGameModeId(undefined)).toBe(false);
  });

  it('labels only the rounds of extra modes', () => {
    expect(modeLabel('classic')).toBe('');
    expect(modeLabel('blitz')).toBe('Relâmpago');
    expect(modeLabel(extra.id, modes)).toBe('Extra');
    expect(modeLabel(extra.id)).toBe('');
  });

  it('offers the blitz mode as an extra, saying how long it lasts', () => {
    expect(GAME_MODES).toContain(BLITZ_MODE);
    expect(isMainMode(BLITZ_MODE)).toBe(false);
    expect(BLITZ_MODE.tagline).toContain(`${BLITZ_SECONDS} segundos`);
  });
});
