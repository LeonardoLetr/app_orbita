import { RoundRules } from './round-rules';
import { Theme } from './theme';

/** Saved with every round, so an id must never change once it is in use. */
export type GameModeId = 'classic' | 'blitz' | 'survival' | 'theme';

/** A way of playing: its name for the player, its address and its rules. */
export interface GameMode {
  readonly id: GameModeId;
  /** Name shown to the player. */
  readonly name: string;
  /** Short invitation shown where modes are chosen. */
  readonly tagline: string;
  /** Last part of the address, as in `/jogar/relampago`. The main mode has none. */
  readonly slug?: string;
  /** The theme its rounds are about, in the mode played by theme. */
  readonly theme?: Theme;
  readonly rules: RoundRules;
}
