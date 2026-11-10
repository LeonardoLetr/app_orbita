import { Category } from '../models/category';
import { Theme, ThemeId } from '../models/theme';

export const THEMES: readonly Theme[] = [
  {
    id: 'nature',
    name: 'Natureza',
    slug: 'natureza',
    tagline: 'Bichos, plantas, frutas e tudo o que é vivo.',
    tone: 'bg-meteorite',
  },
  {
    id: 'daily',
    name: 'Dia a dia',
    slug: 'dia-a-dia',
    tagline: 'A casa, a rua, as roupas e as profissões.',
    tone: 'bg-supernova',
  },
  {
    id: 'science',
    name: 'Ciência e espaço',
    slug: 'ciencia-e-espaco',
    tagline: 'Astros, elementos, invenções e cientistas.',
    tone: 'bg-satellite',
  },
  {
    id: 'world',
    name: 'Mundo',
    slug: 'mundo',
    tagline: 'Países, capitais, rios, ilhas e moedas.',
    tone: 'bg-comet',
  },
  {
    id: 'brazil',
    name: 'Brasil',
    slug: 'brasil',
    tagline: 'Estados, cidades, comidas, folclore e história.',
    tone: 'bg-star-400',
  },
  {
    id: 'culture',
    name: 'Arte e esporte',
    slug: 'arte-e-esporte',
    tagline: 'Música, dança, pintura, contos e esportes.',
    tone: 'bg-pulsar',
  },
];

/** A theme is only worth a round of its own with enough categories for rounds to vary. */
export const MIN_THEME_CATEGORIES = 9;

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function themeName(id: ThemeId): string {
  return THEMES.find((theme) => theme.id === id)?.name ?? '';
}

/** The categories that belong to a theme. */
export function categoriesOf(all: readonly Category[], theme: ThemeId): Category[] {
  return all.filter((category) => category.themes?.includes(theme));
}
