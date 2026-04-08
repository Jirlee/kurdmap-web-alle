import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component'),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component'),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component'),
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories.component'),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/privacy/privacy.component'),
  },
  {
    path: 'policy',
    loadComponent: () => import('./features/privacy/privacy.component'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
