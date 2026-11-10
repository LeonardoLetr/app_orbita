import { GameMode, GameModeId } from '../models/game-mode';
import { BLITZ_RULES, BLITZ_SECONDS } from './blitz-rules';
import { CLASSIC_RULES } from './classic-rules';
import { SURVIVAL_LIVES, SURVIVAL_RULES } from './survival-rules';

export const CLASSIC_MODE: GameMode = {
  id: 'classic',
  name: 'Clássico',
  tagline: '7 categorias, 30 segundos para cada uma.',
  rules: CLASSIC_RULES,
};

export const BLITZ_MODE: GameMode = {
  id: 'blitz',
  name: 'Relâmpago',
  tagline: `${BLITZ_SECONDS} segundos para responder o máximo que conseguir.`,
  slug: 'relampago',
  rules: BLITZ_RULES,
};

export const SURVIVAL_MODE: GameMode = {
  id: 'survival',
  name: 'Sobrevivência',
  tagline: `${SURVIVAL_LIVES} vidas para ir além de Plutão, com o tempo cada vez mais curto.`,
  slug: 'sobrevivencia',
  rules: SURVIVAL_RULES,
};

/** Every way of playing, the main one first. */
export const GAME_MODES: readonly GameMode[] = [CLASSIC_MODE, BLITZ_MODE, SURVIVAL_MODE];

/** The main mode opens with the big button on the home screen; the others are extras. */
export function isMainMode(mode: GameMode): boolean {
  return !mode.slug;
}

/** Address of the game screen for a mode. */
export function modeLink(mode: GameMode): string {
  return mode.slug ? `/jogar/${mode.slug}` : '/jogar';
}

export function isGameModeId(
  value: unknown,
  modes: readonly GameMode[] = GAME_MODES,
): value is GameModeId {
  return modes.some((mode) => mode.id === value);
}

/** Name to show next to a round played in an extra mode; nothing for the main mode. */
export function modeLabel(id: GameModeId, modes: readonly GameMode[] = GAME_MODES): string {
  const mode = modes.find((candidate) => candidate.id === id);
  return mode && !isMainMode(mode) ? mode.name : '';
}
