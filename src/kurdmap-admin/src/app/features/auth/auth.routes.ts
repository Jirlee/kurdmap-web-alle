import { Routes } from '@angular/router';
import { loginGuard } from '../../core/auth';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
];
