import { Routes } from '@angular/router';
import { Game } from './features/game/game';
import { HistoryPage } from './features/history/history-page';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Órbita — jogo de categorias' },
  { path: 'jogar', component: Game, title: 'Partida — Órbita' },
  { path: 'historico', component: HistoryPage, title: 'Histórico — Órbita' },
  { path: '**', redirectTo: '' },
];
