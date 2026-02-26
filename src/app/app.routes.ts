import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'match' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'match', loadComponent: () => import('./pages/mortgage-match/mortgage-match.page').then((m) => m.MortgageMatchPage) },
  { path: 'programs', loadComponent: () => import('./pages/programs-list/programs-list.page').then((m) => m.ProgramsListPage) },
  { path: 'programs/:id', loadComponent: () => import('./pages/program-detail/program-detail.page').then((m) => m.ProgramDetailPage) },
];
