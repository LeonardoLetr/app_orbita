/** Saved with rounds and written in the category base, so an id must never change. */
export type ThemeId = 'nature' | 'daily' | 'science' | 'world' | 'brazil' | 'culture';

/** A subject that groups categories, for rounds that only ask about it. */
export interface Theme {
  readonly id: ThemeId;
  /** Name shown to the player. */
  readonly name: string;
  /** Last part of the address, as in `/jogar/tema/natureza`. */
  readonly slug: string;
  /** A taste of what the theme asks about. */
  readonly tagline: string;
  /** Background class of the theme's card. */
  readonly tone: string;
}
