import { GameMode, GameModeId } from '../models/game-mode';
import { CLASSIC_RULES } from './classic-rules';
import {
  CLASSIC_MODE,
  GAME_MODES,
  isGameModeId,
  isMainMode,
  modeLabel,
  modeLink,
} from './game-modes';

describe('game modes', () => {
  /** A stand-in for the extra modes still to come. */
  const extra: GameMode = {
    id: 'extra' as GameModeId,
    name: 'Relâmpago',
    tagline: 'Rápido.',
    slug: 'relampago',
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
    expect(modeLink(extra)).toBe('/jogar/relampago');
  });

  it('knows which ids exist', () => {
    expect(isGameModeId('classic')).toBe(true);
    expect(isGameModeId('extra')).toBe(false);
    expect(isGameModeId('extra', modes)).toBe(true);
    expect(isGameModeId(undefined)).toBe(false);
  });

  it('labels only the rounds of extra modes', () => {
    expect(modeLabel('classic', modes)).toBe('');
    expect(modeLabel(extra.id, modes)).toBe('Relâmpago');
    expect(modeLabel(extra.id)).toBe('');
  });
});
