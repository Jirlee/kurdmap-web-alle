# KurdMap Admin Panel — Development Guide

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** 10+
- **Podman** or **Docker** (for containerized deployment)
- **ASP.NET Core API** running at `http://localhost:8080`

---

## Quick Start

```bash
# Navigate to admin panel
cd src/kurdmap-admin

# Install dependencies
npm install

# Start development server (port 4300)
npm start
```

The app opens at **http://localhost:4300** with API requests proxied to `http://localhost:8080`.

---

## Project Structure

```
src/kurdmap-admin/
├── src/
│   ├── app/
│   │   ├── core/           # Singleton services, auth, models, utils
│   │   ├── shared/         # Reusable UI components
│   │   ├── layout/         # Main + Login layouts
│   │   ├── features/       # Feature pages (lazy-loaded)
│   │   ├── app.routes.ts   # Route definitions
│   │   ├── app.config.ts   # App providers
│   │   └── app.ts          # Root component
│   ├── environments/       # Environment configs
│   ├── styles.css          # Tailwind + design tokens
│   └── main.ts             # Bootstrap
├── angular.json            # Angular CLI config
├── tsconfig.json           # TypeScript config (with path aliases)
├── proxy.conf.json         # Dev proxy → API
└── package.json
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 4300 |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npx ng test --watch` | Run tests in watch mode |

---

## Connecting to the API

### Development

The development server proxies `/api/*` requests to `http://localhost:8080` via `proxy.conf.json`.

Make sure the API is running:

```bash
# Option 1: Run API directly
cd src/KurdMap.API
dotnet run

# Option 2: Run via Podman
podman-compose up -d postgres redis api
```

### Production (Docker)

In Docker, Nginx reverse-proxies `/api/*` to the `api` service container.

---

## Authentication

- **JWT-based**: Access token (15 min) + Refresh token (7 days)
- **Storage**: `sessionStorage` (cleared on tab close)
- **Auto-refresh**: Interceptor handles 401 and retries with refreshed token
- **Roles**: SuperAdmin, Admin, Moderator (only these can access the admin panel)

### Test Login

Use the seeded admin account:
```
Email: admin@kurdmap.de
Password: (as configured in seed data)
```

---

## Styling

### Tailwind CSS 4

The design system is defined in `src/styles.css` using `@theme`:

```css
@theme {
  --color-primary-500: #2563eb;
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  /* ... */
}
```

### Dark Mode

Toggle via the topbar button. Uses `.dark` class on `<html>` with Tailwind's `dark:` variant:

```html
<div class="bg-bg dark:bg-gray-900 text-text dark:text-gray-100">
```

### RTL Support

Kurdish (Sorani) uses RTL. The app uses `dir="rtl"` on `<html>` with logical Tailwind classes where needed.

---

## Path Aliases

Configured in `tsconfig.json`:

| Alias | Maps To |
|-------|---------|
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@features/*` | `src/app/features/*` |
| `@env/*` | `src/environments/*` |

---

## Docker / Podman

### Build and Run Everything

```bash
# From project root
podman-compose up -d --build
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 17 |
| `redis` | 6379 | Redis 7 |
| `api` | 8080 | ASP.NET Core API |
| `admin` | 8081 | Angular Admin (Nginx) |
| `frontend` | 4000 | Angular Frontend (SSR) |

### Build Admin Only

```bash
podman build -f docker/admin.Dockerfile -t kurdmap-admin .
podman run -p 8081:8081 kurdmap-admin
```

### Nginx Configuration

`docker/admin-nginx.conf` handles:
- SPA fallback routing (`try_files $uri /index.html`)
- API reverse proxy (`/api/` → `http://api:8080`)
- Static asset caching (1 year for hashed files)
- Gzip compression
- Security headers

---

## Testing

### Run Tests

```bash
npm test            # Single run
npx ng test --watch # Watch mode
```

### Test Structure

```
src/app/core/auth/auth.store.spec.ts          # Auth state management
src/app/core/services/notification.service.spec.ts  # Toast notifications
src/app/core/services/theme.service.spec.ts         # Dark mode
src/app/core/utils/display-helpers.spec.ts          # Labels, colors, l10n
```

### Adding Tests

Create `*.spec.ts` next to the file being tested:

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should work', () => {
    expect(service).toBeTruthy();
  });
});
```

---

## Environment Configuration

| File | API URL | Used When |
|------|---------|-----------|
| `environment.ts` | `http://localhost:8080` | Development (`ng serve`) |
| `environment.prod.ts` | `/api` | Production build (Nginx proxies) |

---

## Feature Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `LoginComponent` | `loginGuard` (redirects if already logged in) |
| `/` | `DashboardComponent` | `authGuard` |
| `/users` | `UsersComponent` | `authGuard` |
| `/businesses` | `BusinessesComponent` | `authGuard` |
| `/categories` | `CategoriesComponent` | `authGuard` |

All feature routes are **lazy-loaded** for optimal bundle splitting.

---

## Languages

The admin panel UI is in **Kurdish Sorani** (RTL). The app manages multilingual content in 4 languages:

| Code | Language |
|------|----------|
| `ku` | Kurdish Sorani (primary) |
| `kmr` | Kurdish Kurmanji |
| `de` | German |
| `en` | English |

Use `getLocalized(text, lang)` from `core/utils` to extract the correct translation.
