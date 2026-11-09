import { Route, Routes } from '@angular/router';
import { GAME_MODES, isMainMode, modeLink } from './core/data/game-modes';
import { Game } from './features/game/game';
import { HistoryPage } from './features/history/history-page';
import { Home } from './features/home/home';

/** The game screen once per mode, each at its own address and with its rules in the data. */
const gameRoutes = GAME_MODES.map((mode): Route => ({
  path: modeLink(mode).slice(1),
  component: Game,
  title: `${isMainMode(mode) ? 'Partida' : mode.name} — Astropalavra`,
  data: { mode },
}));

export const routes: Routes = [
  { path: '', component: Home, title: 'Astropalavra — jogo de categorias' },
  ...gameRoutes,
  { path: 'historico', component: HistoryPage, title: 'Histórico — Astropalavra' },
  { path: '**', redirectTo: '' },
];
