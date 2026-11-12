import { Route, Routes } from '@angular/router';
import { GAME_MODES, THEMED_MODES, THEME_MODE, isMainMode, modeLink } from './core/data/game-modes';
import { Game } from './features/game/game';
import { HistoryPage } from './features/history/history-page';
import { Home } from './features/home/home';
import { LogbookCategoryPage } from './features/logbook/logbook-category-page';
import { LogbookPage } from './features/logbook/logbook-page';
import { ThemePage } from './features/themes/theme-page';

/** The game screen once per mode, each at its own address and with its rules in the data. */
const gameRoutes = GAME_MODES.filter((mode) => mode !== THEME_MODE).map((mode): Route => ({
  path: modeLink(mode).slice(1),
  component: Game,
  title: `${isMainMode(mode) ? 'Partida' : mode.name} — Astropalavra`,
  data: { mode },
}));

/** The theme mode opens on the choice of theme; each theme then has its own game screen. */
const themeRoutes: Routes = [
  {
    path: modeLink(THEME_MODE).slice(1),
    component: ThemePage,
    title: `${THEME_MODE.name} — Astropalavra`,
  },
  ...THEMED_MODES.map((mode): Route => ({
    path: modeLink(mode).slice(1),
    component: Game,
    title: `Tema ${mode.theme?.name} — Astropalavra`,
    data: { mode },
  })),
];

export const routes: Routes = [
  { path: '', component: Home, title: 'Astropalavra — jogo de categorias' },
  ...gameRoutes,
  ...themeRoutes,
  { path: 'diario', component: LogbookPage, title: 'Diário de bordo — Astropalavra' },
  {
    path: 'diario/:id',
    component: LogbookCategoryPage,
    title: 'Diário de bordo — Astropalavra',
  },
  { path: 'historico', component: HistoryPage, title: 'Histórico — Astropalavra' },
  { path: '**', redirectTo: '' },
];
