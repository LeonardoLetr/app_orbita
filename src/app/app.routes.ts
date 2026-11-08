import { Routes } from '@angular/router';
import { Game } from './features/game/game';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Órbita — jogo de categorias' },
  { path: 'jogar', component: Game, title: 'Partida — Órbita' },
  { path: '**', redirectTo: '' },
];
