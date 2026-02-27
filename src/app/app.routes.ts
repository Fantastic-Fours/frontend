import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'match' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
  { path: 'match', loadComponent: () => import('./pages/mortgage-match/mortgage-match.page').then((m) => m.MortgageMatchPage) },
  { path: 'programs', loadComponent: () => import('./pages/programs-list/programs-list.page').then((m) => m.ProgramsListPage) },
  { path: 'programs/:id', loadComponent: () => import('./pages/program-detail/program-detail.page').then((m) => m.ProgramDetailPage) },
  { path: 'news', loadComponent: () => import('./pages/news/news.page').then((m) => m.NewsPage) },
  { path: 'news/:id', loadComponent: () => import('./pages/news-detail/news-detail.page').then((m) => m.NewsDetailPage) },
  { path: 'estate/primary', loadComponent: () => import('./pages/estate-primary/estate-primary.page').then((m) => m.EstatePrimaryPage) },
  { path: 'estate/secondary', loadComponent: () => import('./pages/estate-secondary/estate-secondary.page').then((m) => m.EstateSecondaryPage) },
  { path: 'estate/apartment/:id', loadComponent: () => import('./pages/apartment-detail/apartment-detail.page').then((m) => m.ApartmentDetailPage) },
  { path: 'estate/submit', loadComponent: () => import('./pages/submit-ad/submit-ad.page').then((m) => m.SubmitAdPage) },
];
