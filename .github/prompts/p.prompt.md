---
name: p
description: KurdMap development prompt — use when writing code for any of the three services (API, Frontend, Admin).
---
https://learn.microsoft.com/de-de/aspnet/core/web-api/?view=aspnetcore-10.0
# KurdMap Development Prompt

You are an expert software developer working on **KurdMap** — a multilingual directory platform for Kurdish businesses in Cologne and Düsseldorf, Germany.

## Architecture Overview

| Service | Stack | Entry Point |
|---------|-------|-------------|
| KurdMap.API | ASP.NET Core 10, Clean Architecture, CQRS + MediatR, PostgreSQL | `src/KurdMap.API/` |
| kurdmap-frontend | Angular 19+, SSR, Tailwind CSS, Leaflet | `src/kurdmap-frontend/` |
| KurdMap.AdminPanel | Blazor Server, MudBlazor | `src/KurdMap.AdminPanel/` |

## Rules You MUST Follow

### Architecture
- **Clean Architecture** layer rule: Domain → Application → Infrastructure → API. Never reverse dependencies.
- **CQRS**: Commands (writes) and Queries (reads) are separate. Use MediatR for dispatch.
- **Pipeline Behaviors**: Validation, Logging, Performance monitoring happen via MediatR behaviors — do NOT add these inline.
- **Result Pattern**: Return `Result<T>` from handlers, never throw exceptions for business logic.

### Entity Creation
- Use **Factory Methods**: `Business.Create(name, slug, categoryId, ...)` — not `new Business()`.
- All entities: `Guid Id`, `DateTime CreatedAt`, `DateTime? UpdatedAt`, `EntityStatus Status`.
- Soft deletes only: set `Status = Deleted`, never hard delete.

### Multilingual Text
- User-facing text has 4 language columns: `_ku` (Kurdish Sorani), `_kmr` (Kurdish Kurmanji), `_de` (German), `_en` (English).
- Use `MultilingualText` Value Object in Domain: `new MultilingualText(ku, kmr, de, en)`.
- Example: `business.Name.Ku`, `business.Name.Kmr`, `category.Name.De`.

### Database
- PostgreSQL with **snake_case** naming.
- UUIDs for all primary keys.
- JSONB for flexible data (opening hours, social links).
- GIN indexes for full-text search on multilingual columns.
- EF Core Fluent API configurations in `Infrastructure/Persistence/Configurations/`.

### API
- RESTful endpoints: `GET /api/v1/businesses`, `POST /api/v1/businesses`.
- Always return paginated results for list endpoints: `PaginatedList<T>`.
- Public endpoints use **slug** (not ID): `GET /api/v1/businesses/{slug}`.
- FluentValidation for all request validation.
- JWT Bearer authentication, policy-based authorization.

### Angular Frontend
- Feature-based lazy-loaded structure.
- Angular **Signals** for reactive state.
- **Tailwind CSS** only (no CSS modules or inline styles).
- **Leaflet + OpenStreetMap** for maps.
- RTL support for Kurdish (`ku`, `kmr`) locales.
- i18n with `@angular/localize` or `ngx-translate`.

### Blazor Admin Panel
- **MudBlazor** components exclusively.
- Shared DTOs from `KurdMap.Shared`.
- Role-based rendering: SuperAdmin > Admin > Moderator.

### Security
- JWT: 15-min access token, 7-day refresh token with rotation.
- Rate limiting on all endpoints (strict on `/api/v1/auth/*`).
- Image uploads: validate extension + magic bytes, max 5MB, GUID filenames.
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP.

## Reference Documentation

Full architecture decisions and patterns are documented in `Docs/Plan/`:
- `01-research-analysis.md` — Market research & technology decisions
- `02-architecture.md` — System architecture & project structure
- `03-design-patterns.md` — SOLID, DDD, CQRS patterns with code examples
- `04-development-guidelines.md` — Coding standards, Git workflow
- `05-security.md` — Security architecture, RBAC, OWASP mitigations
- `06-devops-cicd.md` — CI/CD, Docker, deployment
- `07-roadmap.md` — Development phases with stories
- `08-database-design.md` — Database schema, EF Core config, seed data