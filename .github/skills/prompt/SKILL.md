---
name: prompt
description: KurdMap project context, conventions, and AI prompting guidelines for consistent development across all three services.
---
https://learn.microsoft.com/de-de/aspnet/core/web-api/?view=aspnetcore-10.0
# KurdMap – AI Prompt Skill

## Project Context

**KurdMap** is a multilingual directory platform for Kurdish businesses **across Europe**, headquartered in **Germany**. It connects locals, tourists, and the Kurdish diaspora with restaurants, barbershops, hotels, and services.

### Architecture: 3 Independent Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| **KurdMap.API** | ASP.NET Core 10 | REST API, Clean Architecture, CQRS + MediatR, PostgreSQL |
| **kurdmap-frontend** | Angular 19+ | Public website, SSR, Tailwind CSS, Leaflet maps, i18n (4 languages) |
| **KurdMap.AdminPanel** | Blazor Server | Admin dashboard, MudBlazor, business verification, user management |

### Solution Structure (Clean Architecture)

```
src/
├── KurdMap.Domain/           # Entities, Value Objects, Interfaces (ZERO dependencies)
├── KurdMap.Application/      # CQRS handlers, DTOs, Validators, Behaviors
├── KurdMap.Infrastructure/   # EF Core, Repositories, Services, Identity
├── KurdMap.API/              # Controllers, Middleware (entry point)
├── KurdMap.Shared/           # Shared DTOs between API and Admin
├── KurdMap.AdminPanel/       # Blazor Server admin panel
└── kurdmap-frontend/         # Angular 19+ SPA
```

**Dependency Rule:** Domain has ZERO dependencies → Application depends on Domain → Infrastructure implements interfaces → API wires via DI.

## Design Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| Clean Architecture | Solution-wide | Layer separation, testability |
| CQRS | Application | Read/write separation |
| MediatR | Application | Decoupled request handling with pipeline behaviors |
| Repository + UoW | Infrastructure | Data access abstraction |
| Result Pattern | Application | Error handling without exceptions |
| Factory Method | Domain entities | Controlled object creation (`Business.Create()`) |
| Value Objects | Domain | Immutable types: `Address`, `Coordinates`, `MultilingualText` |
| Domain Events | Domain | Side effects: `BusinessCreatedEvent`, `BusinessVerifiedEvent` |
| Pipeline Behaviors | MediatR | Cross-cutting: Validation, Logging, Performance |

## Coding Conventions

### General
- Code comments, variable names, documentation in **English**
- User-facing text: **4 languages** — Kurdish (Sorani), Kurdish (Kurmanji), German, English
- **Conventional Commits**: `feat(businesses): implement search endpoint`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `security`

### C# Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Class | PascalCase | `BusinessRepository` |
| Interface | I + PascalCase | `IBusinessRepository` |
| Method | PascalCase + Async | `GetBySlugAsync` |
| Private field | _camelCase | `_businessRepository` |
| Parameter | camelCase | `businessId` |
| Command | `{Action}{Entity}Command` | `CreateBusinessCommand` |
| Query | `Get{Entity}Query` | `SearchBusinessesQuery` |
| Validator | `{Name}Validator` | `CreateBusinessCommandValidator` |
| Configuration | `{Entity}Configuration` | `BusinessConfiguration` |

### TypeScript / Angular Naming
| Element | Convention | Example |
|---------|-----------|---------|
| File | kebab-case | `business-detail.component.ts` |
| Class | PascalCase | `BusinessDetailComponent` |
| Method | camelCase | `searchBusinesses()` |
| Route | kebab-case | `/business-detail/:slug` |

### Database Naming (PostgreSQL)
| Element | Convention | Example |
|---------|-----------|---------|
| Table | snake_case, plural | `businesses`, `menu_items` |
| Column | snake_case | `name_ku`, `created_at` |
| PK | `id` (uuid) | `gen_random_uuid()` |
| FK | `{entity}_id` | `category_id` |
| Index | `ix_{table}_{column}` | `ix_businesses_slug` |

### Backend (.NET) Rules
- **Clean Architecture**: Domain → Application → Infrastructure → API
- **CQRS** with MediatR (Commands & Queries separated)
- **FluentValidation** for all command/query inputs
- **Result pattern** for error handling (no exceptions for business logic)
- **Repository pattern** with Unit of Work
- Entity configurations in **separate files** using Fluent API
- Always use **EF Core migrations**, never modify DB directly
- API follows **RESTful conventions** with proper HTTP status codes
- All list endpoints must support **pagination** (`PaginatedList<T>`)
- **JWT authentication** with ASP.NET Identity, policy-based authorization
- Roles: `SuperAdmin`, `Admin`, `Moderator`, `BusinessOwner`, `User`
- All entities use `Guid` IDs, `CreatedAt`/`UpdatedAt` timestamps
- Soft deletes via `Status` column (never hard delete)

### Frontend (Angular) Rules
- Feature-based structure with **lazy loading**
- Use Angular **Signals** for state management
- **Tailwind CSS** for styling (no inline styles)
- **RTL layout** support for Kurdish
- All HTTP calls through services in `core/services/`
- Loading skeletons and error states for all async operations
- **Leaflet + OpenStreetMap** for maps (not Google Maps)

### Admin Panel (Blazor) Rules
- **MudBlazor** components only
- Shared DTOs from `KurdMap.Shared` project
- All API calls through centralized `ApiClient` service
- Role-based UI visibility (SuperAdmin, Admin, Moderator)

### Database (PostgreSQL) Rules
- All IDs are **UUID** (`gen_random_uuid()`)
- Multilingual columns: `name_ku`, `name_kmr`, `name_de`, `name_en`
- Timestamps: `created_at`, `updated_at` with `timestamptz`
- Soft deletes via `status` column
- JSON columns use `jsonb` type
- Full-text search with **GIN indexes** on multilingual name columns

## Security Rules
- JWT with **15 min access token**, **7 day refresh token** (rotation)
- **PBKDF2** password hashing (ASP.NET Identity default)
- **CORS** restricted to known origins
- **Rate limiting** on all endpoints (strict on auth)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- Image upload: validate extension + magic bytes + max 5MB + GUID naming
- Never expose internal IDs in public URLs — use **slug** instead
- No hardcoded credentials — use environment variables

## When Generating Code

1. **Check existing patterns** in the project before generating new code
2. **Reference documentation** in `Docs/Plan/` for architecture decisions
3. **Follow the multilingual pattern** — all user-facing text needs `_ku`, `_kmr`, `_de`, `_en` columns
4. **Use Factory Methods** for entity creation (`Business.Create(...)`)
5. **Write tests**: Unit tests for domain/application, integration tests for API
6. **Validate all inputs** at the API boundary with FluentValidation
7. **Use Result pattern** — no exceptions for business logic errors
8. **Apply CQRS** — separate commands (writes) from queries (reads)
9. **Use Pipeline Behaviors** — validation + logging happen automatically
10. **Cache read-heavy queries** — categories, cities, search results via Redis