import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'programs/:id', renderMode: RenderMode.Server },
  { path: 'banks/:id', renderMode: RenderMode.Server },
  { path: 'news/:id', renderMode: RenderMode.Server },
  { path: 'estate/apartment/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
