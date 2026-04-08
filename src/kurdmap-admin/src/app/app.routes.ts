import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginLayoutComponent } from './layout/login-layout/login-layout.component';

export const routes: Routes = [
  // Auth routes (no sidebar)
  {
    path: 'login',
    component: LoginLayoutComponent,
    canActivate: [loginGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
    ],
  },
  {
    path: 'totp-verify',
    component: LoginLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/totp-verify/totp-verify.component').then(m => m.TotpVerifyComponent),
      },
    ],
  },
  // Admin routes (with sidebar)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'businesses',
        loadComponent: () =>
          import('./features/businesses/businesses.component').then(m => m.BusinessesComponent),
      },
      {
        path: 'cities',
        loadComponent: () =>
          import('./features/cities/cities.component').then(m => m.CitiesComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then(m => m.CategoriesComponent),
      },
      {
        path: 'advertisements',
        loadComponent: () =>
          import('./features/advertisements/advertisements.component').then(m => m.AdvertisementsComponent),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/reviews/reviews.component').then(m => m.ReviewsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'roadmap',
        loadComponent: () =>
          import('./features/roadmap/roadmap.component').then(m => m.RoadmapComponent),
      },
    ],
  },
  // Fallback
  { path: '**', redirectTo: '' },
];
