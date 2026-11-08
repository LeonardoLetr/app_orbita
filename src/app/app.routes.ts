import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Órbita — jogo de categorias' },
  { path: '**', redirectTo: '' },
];
