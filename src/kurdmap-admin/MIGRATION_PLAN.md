# KurdMap Admin Panel — Migration Plan

## Blazor Server → Angular 21 + Tailwind CSS

### Overview

This document describes the full migration of the KurdMap Admin Panel from a **Blazor Server (.NET)** architecture to a modern **Angular 21 SPA** with **Tailwind CSS 4**.

---

## 1. Migration Summary

| Aspect | Before (Blazor) | After (Angular 21) |
|--------|-----------------|---------------------|
| **Framework** | Blazor Server (.NET 10) | Angular 21 (Standalone) |
| **UI Library** | FluentUI Blazor | Tailwind CSS 4 |
| **State Management** | C# services + CascadingAuthState | Signal-based stores |
| **Routing** | Blazor Router | Angular Router (lazy-loaded) |
| **HTTP Client** | `HttpClient` + `AuthenticatedHttpHandler` | Angular `HttpClient` + functional interceptor |
| **Auth** | `JwtAuthStateProvider` + `AuthTokenStore` | `AuthStore` (signals) + `authInterceptor` |
| **Runtime** | .NET CLR (WebSocket) | Browser JS (SPA) |
| **Serving** | Kestrel (ASP.NET) | Nginx (static files) |
| **Testing** | bUnit + xUnit | Vitest + Angular Testing |

---

## 2. Architecture

```
src/app/
├── core/                    # Singleton services, guards, models
│   ├── auth/                # AuthStore, AuthService, guards, interceptor
│   ├── models/              # TypeScript interfaces (DTOs)
│   ├── services/            # ApiService, NotificationService, ThemeService
│   └── utils/               # Display helpers (labels, colors, localization)
├── shared/                  # Reusable UI components
│   └── components/          # Button, Input, Modal, Pagination, etc.
├── layout/                  # Main layout + Login layout
│   ├── main-layout/         # Sidebar, topbar, router-outlet
│   └── login-layout/        # Centered minimal layout
├── features/                # Lazy-loaded feature modules
│   ├── auth/login/          # Login page
│   ├── dashboard/           # Stats dashboard
│   ├── users/               # User management
│   ├── businesses/          # Business management + form dialog
│   └── categories/          # Category management
├── app.routes.ts            # Route definitions
├── app.config.ts            # Application providers
└── app.ts                   # Root component
```

---

## 3. Component Mapping

| Blazor Component | Angular Component | Route |
|-----------------|-------------------|-------|
| `Login.razor` | `LoginComponent` | `/login` |
| `Home.razor` | `DashboardComponent` | `/` |
| `Users.razor` + `UserDetailDialog.razor` | `UsersComponent` | `/users` |
| `Businesses.razor` + `BusinessFormDialog.razor` | `BusinessesComponent` + `BusinessFormDialogComponent` | `/businesses` |
| `Categories.razor` + `CategoryFormDialog` | `CategoriesComponent` | `/categories` |
| `MainLayout.razor` | `MainLayoutComponent` | Layout wrapper |

---

## 4. Service Mapping

| Blazor Service | Angular Service | Purpose |
|---------------|-----------------|---------|
| `ApiClient.cs` | `ApiService` | All REST API calls |
| `AuthTokenStore.cs` | `AuthStore` | JWT state management (signals) |
| `JwtAuthStateProvider.cs` | `AuthStore` (computed signals) | Role checks, auth state |
| `AuthenticatedHttpHandler.cs` | `authInterceptor` | Attach JWT, handle 401 refresh |
| — | `ThemeService` | Dark mode toggle |
| — | `NotificationService` | Toast notifications |

---

## 5. Migration Phases

### Phase 1: Foundation ✅
- [x] Angular 21 project scaffolding
- [x] Tailwind CSS 4 integration with design system
- [x] Core models (TypeScript interfaces from C# DTOs)
- [x] Auth store with signal-based state
- [x] Auth interceptor with token refresh
- [x] Route guards (auth, role, login)

### Phase 2: Shared Components ✅
- [x] Button, Input (with ControlValueAccessor)
- [x] Modal, ConfirmDialog
- [x] Pagination, StatCard
- [x] Toast notification system
- [x] Loading spinner

### Phase 3: Layouts ✅
- [x] Main layout (sidebar + topbar)
- [x] Login layout (centered)
- [x] Dark mode support
- [x] RTL-ready typography

### Phase 4: Feature Pages ✅
- [x] Login page with validation
- [x] Dashboard with stats cards
- [x] User management (search, filter, role change, status toggle)
- [x] Business management (CRUD, verify, image upload)
- [x] Category management (CRUD)

### Phase 5: Infrastructure ✅
- [x] Docker configuration (Nginx-based SPA)
- [x] docker-compose integration
- [x] Environment configuration (dev/prod)
- [x] Proxy configuration for development

### Phase 6: Quality ✅
- [x] Unit tests (AuthStore, NotificationService, ThemeService, display helpers)
- [x] Build verification (zero errors)

---

## 6. API Compatibility

The Angular admin panel connects to the **same ASP.NET Core API** at `/api/v1/*`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | JWT authentication |
| `/api/auth/refresh` | POST | Token refresh |
| `/api/v1/admin/dashboard/stats` | GET | Dashboard statistics |
| `/api/v1/admin/categories` | GET/POST | List/Create categories |
| `/api/v1/admin/categories/:id` | PUT/DELETE | Update/Delete category |
| `/api/v1/admin/businesses` | GET/POST | List/Create businesses |
| `/api/v1/admin/businesses/:slug` | GET/PUT/DELETE | Get/Update/Delete business |
| `/api/v1/admin/businesses/:id/verify` | POST | Verify business |
| `/api/v1/admin/businesses/:id/images` | POST/DELETE | Upload/Delete image |
| `/api/v1/admin/users` | GET | List users |
| `/api/v1/admin/users/:id` | GET | Get user details |
| `/api/v1/admin/users/:id/role` | PUT | Change user role |
| `/api/v1/admin/users/:id/status` | PUT | Toggle user status |

---

## 7. Key Decisions

1. **Standalone Components**: No NgModules — Angular 21 standalone components throughout
2. **Signals for State**: Using Angular signals instead of RxJS for reactive state
3. **Functional Patterns**: Interceptors and guards use functional APIs (`CanActivateFn`, `HttpInterceptorFn`)
4. **Lazy Loading**: All feature routes lazy-loaded for smaller initial bundle
5. **Tailwind CSS 4**: Using `@import "tailwindcss"` with `@theme` for design tokens
6. **Session Storage**: Auth state persisted in sessionStorage (not localStorage) for security
7. **Nginx in Docker**: SPA served via Nginx with API reverse proxy

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| API contract changes | TypeScript interfaces mirror C# DTOs exactly |
| Auth token expiry | Interceptor handles 401 with automatic refresh |
| RTL layout issues | Tailwind logical properties + Arabic/Kurdish font support |
| Bundle size growth | Lazy loading + tree-shaking + budgets in angular.json |
| Browser compatibility | Angular 21 targets ES2022 (modern browsers) |

---

## 9. Rollback Strategy

The Blazor AdminPanel project (`KurdMap.AdminPanel/`) remains unchanged in the repository. To rollback:

1. Revert `docker/admin.Dockerfile` to the Blazor version
2. Revert `docker-compose.yml` admin service configuration
3. Remove the `kurdmap-admin/` directory
4. Rebuild with `podman-compose up -d --build admin`
