import { Routes } from '@angular/router';
import { Game } from './features/game/game';
import { HistoryPage } from './features/history/history-page';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Astropalavra — jogo de categorias' },
  { path: 'jogar', component: Game, title: 'Partida — Astropalavra' },
  { path: 'historico', component: HistoryPage, title: 'Histórico — Astropalavra' },
  { path: '**', redirectTo: '' },
];
