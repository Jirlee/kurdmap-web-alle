# KurdMap – Project Audit Checklist & Comparison with JamApi

> Date: 2026-04-05  
> Comparison: **KurdMap** (ASP.NET Core 10 + Angular 21) vs **JamApi** (.NET 8 + Dapper)

---

## 📋 Table of Contents

1. [Test Results](#1-test-results)
2. [Businesses (بازرگان) Issue Analysis](#2-businesses-بازرگان-issue-analysis)
3. [Feature Completion — API Backend](#3-feature-completion--api-backend)
4. [Feature Completion — Admin Panel (Angular)](#4-feature-completion--admin-panel-angular)
5. [Feature Completion — Frontend (Angular)](#5-feature-completion--frontend-angular)
6. [Standards Comparison: KurdMap vs JamApi](#6-standards-comparison-kurdmap-vs-jamapi)
7. [Missing Features & Roadmap](#7-missing-features--roadmap)
8. [Ideas from JamApi for KurdMap](#8-ideas-from-jamapi-for-kurdmap)
9. [Complete Roadmap — All Phases](#9-complete-roadmap--all-phases)
10. [20 New Ideas for 2026](#10-20-new-ideas-for-2026)
11. [Advertisement / Reklame Feature](#11-advertisement--reklame-feature)

---

## 1. Test Results

### .NET Backend Build
| Item | Status |
|------|--------|
| Solution build (`dotnet build`) | ✅ Passed — 0 errors, 0 warnings |
| KurdMap.Domain | ✅ Built |
| KurdMap.Application | ✅ Built |
| KurdMap.Infrastructure | ✅ Built |
| KurdMap.API | ✅ Built |
| KurdMap.Shared | ✅ Built |
| KurdMap.Migrator | ✅ Built |
| Solution references (Blazor projects removed) | ✅ Fixed — removed `KurdMap.AdminPanel` & `KurdMap.AdminPanel.Tests` from `.slnx` |

### Angular Admin Panel Tests
| Item | Status |
|------|--------|
| Build | ✅ Passed |
| Unit Tests (59 total) | ✅ 59/59 Passed |
| `auth.store.spec.ts` (10 tests) | ✅ Passed |
| `display-helpers.spec.ts` (23 tests) | ✅ Passed |
| `notification.service.spec.ts` (9 tests) | ✅ Passed |
| `theme.service.spec.ts` (5 tests) | ✅ Passed |
| `api.service.advertisements.spec.ts` (6 tests) | ✅ Passed |
| `api.service.reviews.spec.ts` (6 tests) | ✅ Passed |

### .NET Backend Tests
| Item | Status |
|------|--------|
| Unit Tests (77 total) | ✅ 77/77 Passed |
| Integration Tests (13 total) | ✅ 13/13 Passed |
| `ReviewTests` (8 tests) | ✅ Passed |
| `FavoriteTests` (2 tests) | ✅ Passed |
| `ReviewHandlerTests` (8 tests) | ✅ Passed |
| `FavoriteHandlerTests` (3 tests) | ✅ Passed |
| `BusinessHandlerTests` (7 tests) | ✅ Passed |
| `CategoryHandlerTests` (4 tests) | ✅ Passed |
| `CityHandlerTests` (4 tests) | ✅ Passed |
| `AdvertisementHandlerTests` (7 tests) | ✅ Passed |
| `BusinessEntityTests` (14 tests) | ✅ Passed |
| `AdvertisementEntityTests` (6 tests) | ✅ Passed |
| `ValueObjectTests` (7 tests) | ✅ Passed |
| `HealthCheckTests` (1 test) | ✅ Passed |
| `AuthControllerTests` (5 tests) | ✅ Passed |
| `CategoriesControllerTests` (3 tests) | ✅ Passed |
| `BusinessesControllerTests` (4 tests) | ✅ Passed |

### Angular Frontend Tests
| Item | Status |
|------|--------|
| Test configuration | ✅ Vitest + happy-dom configured |
| Unit tests (24 total) | ✅ 24/24 Passed |
| `business.service.spec.ts` (6 tests) | ✅ Passed |
| `category.service.spec.ts` (3 tests) | ✅ Passed |
| `language.service.spec.ts` (9 tests) | ✅ Passed |
| `seo.service.spec.ts` (6 tests) | ✅ Passed |
| E2E tests | ✅ Playwright configured (3 spec files: auth, navigation, accessibility) |

### Summary
| Scope | Tests | Status |
|-------|-------|--------|
| .NET Backend (xUnit) | 90 | ✅ 90/90 |
| Angular Admin (Vitest) | 59 | ✅ 59/59 |
| Angular Frontend (Vitest) | 24 | ✅ 24/24 |
| **Total** | **173** | ✅ **173/173** |

---

## 2. Businesses (بازرگان) Issue Analysis

### Can You Add a Business? — ✅ Code is Complete

The add functionality exists and is fully wired:

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Add button "زیادکردنی بازرگانی" | ✅ Exists |
| **UI** | Form dialog (5 tabs: Basic, Location, Contact, Hours, Images) | ✅ Complete |
| **API Service** | `createBusiness()` → `POST /api/v1/businesses` | ✅ Wired |
| **Controller** | `BusinessesController.Create()` | ✅ Implemented |
| **CQRS** | `CreateBusinessCommand` + Handler + Validator | ✅ Complete |
| **Domain** | `Business.Create()` factory method | ✅ Implemented |
| **Repository** | `BusinessRepository.AddAsync()` | ✅ Implemented |

### Possible Reasons for Add Failure

| # | Possible Cause | How to Check | Fix |
|---|---------------|-------------|-----|
| 1 | **Categories/Cities not loaded** — Dropdowns empty, user can't select | Open browser DevTools → Network tab → Check if `GET /api/v1/categories` and `GET /api/v1/cities` return data | Seed categories & cities in database |
| 2 | **Not logged in / Token expired** — 401 Unauthorized | Check DevTools → Network → POST businesses → Response 401 | Login again, check JWT token expiry |
| 3 | **CORS blocked** — Frontend on different port | Check DevTools → Console → CORS error | Add frontend port to `Cors:AllowedOrigins` in `appsettings.json` |
| 4 | **Missing required fields** — Validation error from backend | Check DevTools → Network → POST response body for validation errors | Fill all required fields (especially Kurdish & German names/descriptions) |
| 5 | **Database not seeded** — No categories or cities exist | Run: `SELECT COUNT(*) FROM categories; SELECT COUNT(*) FROM cities;` | Run seed scripts |
| 6 | **Form validation gap** — `categoryId` and `cityId` not validated client-side | Submit with empty category/city | ✅ **Fixed** — client-side validation added for categoryId, cityId, street, postalCode |

### ✅ Client-Side Validation — Fixed

Validation for `categoryId`, `cityId`, `street`, and `postalCode` has been added to `business-form-dialog.component.ts`. The form now navigates to the Location tab and shows a specific warning if any required field is missing.

---

## 3. Feature Completion — API Backend

### Controllers & Endpoints

| Controller | Endpoint | Method | Status |
|-----------|---------|--------|--------|
| **AuthController** | `/api/v1/auth/register` | POST | ✅ Complete |
| | `/api/v1/auth/login` | POST | ✅ Complete |
| | `/api/v1/auth/refresh` | POST | ✅ Complete |
| **BusinessesController** | `/api/v1/businesses` | GET | ✅ Paginated list |
| | `/api/v1/businesses/search` | GET | ✅ Full-text search |
| | `/api/v1/businesses/{slug}` | GET | ✅ By slug |
| | `/api/v1/businesses` | POST | ✅ Create |
| | `/api/v1/businesses/{id}` | PUT | ✅ Update |
| | `/api/v1/businesses/{id}` | DELETE | ✅ Soft-delete |
| | `/api/v1/businesses/{id}/verify` | POST | ✅ Admin verify |
| **CategoriesController** | `/api/v1/categories` | GET | ✅ Cached |
| | `/api/v1/categories` | POST | ✅ Create (Admin) |
| | `/api/v1/categories/{id}` | PUT | ✅ Update (Admin) |
| | `/api/v1/categories/{id}` | DELETE | ✅ Delete (Admin) |
| **CitiesController** | `/api/v1/cities` | GET | ✅ Cached |
| | `/api/v1/cities` | POST | ✅ Create (Admin) |
| | `/api/v1/cities/{id}` | PUT | ✅ Update (Admin) |
| | `/api/v1/cities/{id}` | DELETE | ✅ Delete (Admin) |
| **BusinessChildrenController** | `/api/v1/businesses/{id}/menu-items` | POST | ✅ Create (Admin) |
| | `/api/v1/businesses/{id}/menu-items/{menuItemId}` | DELETE | ✅ Delete (Admin) |
| | `/api/v1/businesses/{id}/services` | POST | ✅ Create (Admin) |
| | `/api/v1/businesses/{id}/services/{serviceId}` | DELETE | ✅ Delete (Admin) |
| **ImagesController** | `/api/v1/businesses/{id}/images` | POST | ✅ Upload |
| | `/api/v1/businesses/{id}/images/{imageId}/primary` | PUT | ✅ Set primary |
| | `/api/v1/businesses/{id}/images/{imageId}` | DELETE | ✅ Delete |
| **UsersController** | `/api/v1/users` | GET | ✅ Paginated (Admin) |
| | `/api/v1/users/{id}/role` | PUT | ✅ Change role |
| | `/api/v1/users/{id}/status` | PUT | ✅ Toggle status |
| **DashboardController** | `/api/v1/dashboard/stats` | GET | ✅ Stats |
| **AdvertisementsController** | `/api/v1/advertisements` | GET | ✅ List (activeOnly filter) |
| | `/api/v1/advertisements` | POST | ✅ Create (Admin) |
| | `/api/v1/advertisements/{id}` | PUT | ✅ Update (Admin) |
| | `/api/v1/advertisements/{id}/toggle` | PUT | ✅ Toggle active (Admin) |
| | `/api/v1/advertisements/{id}` | DELETE | ✅ Delete (Admin) |
| **ReviewsController** | `/api/v1/reviews/business/{id}` | GET | ✅ Reviews by business |
| | `/api/v1/reviews` | GET | ✅ All reviews (Admin) |
| | `/api/v1/reviews` | POST | ✅ Create (Auth) |
| | `/api/v1/reviews/{id}/approve` | PUT | ✅ Approve (Admin/Moderator) |
| | `/api/v1/reviews/{id}` | DELETE | ✅ Delete (Admin/Moderator) |
| **FavoritesController** | `/api/v1/favorites/{userId}` | GET | ✅ User favorites (Auth) |
| | `/api/v1/favorites` | POST | ✅ Toggle favorite (Auth) |

### CQRS Handlers

| Handler | Type | Validator | Status |
|---------|------|-----------|--------|
| `CreateBusinessCommandHandler` | Command | ✅ | ✅ Complete |
| `UpdateBusinessCommandHandler` | Command | ✅ | ✅ Complete |
| `DeleteBusinessCommandHandler` | Command | — | ✅ Complete |
| `VerifyBusinessCommandHandler` | Command | — | ✅ Complete |
| `UploadBusinessImageCommandHandler` | Command | — | ✅ Complete |
| `DeleteBusinessImageCommandHandler` | Command | — | ✅ Complete |
| `SetPrimaryImageCommandHandler` | Command | — | ✅ Complete |
| `CreateCategoryCommandHandler` | Command | ✅ | ✅ Complete |
| `UpdateCategoryCommandHandler` | Command | ✅ | ✅ Complete |
| `SearchBusinessesQueryHandler` | Query | ✅ | ✅ Complete |
| `GetBusinessesListQueryHandler` | Query | ✅ | ✅ Complete |
| `GetBusinessBySlugQueryHandler` | Query | — | ✅ Complete |
| `GetCategoriesQueryHandler` | Query | — | ✅ Complete |
| `GetCitiesQueryHandler` | Query | — | ✅ Complete |
| **MenuItems CRUD Handlers** | — | — | ✅ Create + Delete |
| **BusinessServices CRUD Handlers** | — | — | ✅ Create + Delete |
| **Cities CRUD Handlers** | Command | — | ✅ Create + Update + Delete |
| **Delete Category Handler** | Command | — | ✅ Complete |
| **CreateAdvertisementHandler** | Command | ✅ | ✅ Complete |
| **UpdateAdvertisementHandler** | Command | — | ✅ Complete |
| **DeleteAdvertisementHandler** | Command | — | ✅ Complete |
| **ToggleAdvertisementHandler** | Command | — | ✅ Complete |
| **GetAdvertisementsQueryHandler** | Query | — | ✅ Complete |
| **CreateReviewHandler** | Command | ✅ | ✅ Complete (duplicate check) |
| **ApproveReviewHandler** | Command | — | ✅ Complete |
| **DeleteReviewHandler** | Command | — | ✅ Complete |
| **GetReviewsByBusinessHandler** | Query | — | ✅ Complete |
| **GetAllReviewsHandler** | Query | — | ✅ Complete |
| **ToggleFavoriteHandler** | Command | — | ✅ Complete |
| **GetUserFavoritesHandler** | Query | — | ✅ Complete |

### Domain Entities

| Entity | Factory Method | Events | Status |
|--------|---------------|--------|--------|
| `Business` | ✅ `Create()` | ✅ Created, Verified, Deactivated | ✅ Complete |
| `BusinessImage` | ✅ | — | ✅ Complete |
| `MenuItem` | ✅ | — | ✅ Create + Delete via Business aggregate |
| `BusinessService` | ✅ | — | ✅ Create + Delete via Business aggregate |
| `Category` | ✅ `Create()` | — | ✅ Complete |
| `City` | ✅ `Create()` | — | ✅ Complete |
| `Advertisement` | ✅ `Create()` | — | ✅ Complete (Title, Description, Image, Link, Date Range, Toggle) |
| `Review` | ✅ `Create()` | — | ✅ Complete (Rating 1-5, Comment, Approve/Reject) |
| `Favorite` | ✅ `Create()` | — | ✅ Complete (Toggle add/remove) |

### Value Objects

| Value Object | Status |
|-------------|--------|
| `MultilingualText` (Ku, Kmr, De, En) | ✅ Complete |
| `Address` (Street, PostalCode, CityId) | ✅ Complete |
| `Coordinates` (Latitude, Longitude) | ✅ Complete |
| `OpeningHours` (7 DaySchedules) | ✅ Complete |

---

## 4. Feature Completion — Admin Panel (Angular 21)

### Pages & CRUD

| Page | Route | List | Create | Edit | Delete | Other | Status |
|------|-------|------|--------|------|--------|-------|--------|
| **Login** | `/login` | — | — | — | — | JWT Auth | ✅ Complete |
| **Dashboard** | `/` | — | — | — | — | Stats cards | ✅ Complete |
| **Businesses** | `/businesses` | ✅ | ✅ | ✅ | ✅ | Verify, Images, Search, Filter | ✅ Complete |
| **Categories** | `/categories` | ✅ | ✅ | ✅ | ✅ | — | ✅ Complete |
| **Users** | `/users` | ✅ | ❌ | ❌ | ❌ | Role change, Status toggle | ⚠️ Partial |
| **Cities** | `/cities` | ✅ | ✅ | ✅ | ✅ | — | ✅ Complete |
| **MenuItems** | — (tab in business form) | ✅ | ✅ | — | ✅ | — | ✅ Complete |
| **BusinessServices** | — (tab in business form) | ✅ | ✅ | — | ✅ | — | ✅ Complete |
| **Advertisements** | `/advertisements` | ✅ | ✅ | ✅ | ✅ | Toggle active/inactive | ✅ Complete |
| **Reviews** | `/reviews` | ✅ | — | — | ✅ | Approve/Reject moderation | ✅ Complete |
| **Reports** | `/reports` | ✅ | — | — | — | Stats + Rating analytics | ✅ Complete |
| **Settings** | — | ✅ | ✅ | ✅ | ✅ | 4 sections: General, Features, Upload/Cache, SMTP | ✅ Complete |

### Shared Components

| Component | Status |
|-----------|--------|
| Button | ✅ |
| Input | ✅ |
| Modal / ConfirmDialog | ✅ |
| Pagination | ✅ |
| StatCard | ✅ |
| Toast / Notification | ✅ |
| Loading | ✅ |
| Sidebar + Topbar Layout | ✅ |

---

## 5. Feature Completion — Frontend (Angular 19+)

| Page | Route | Status |
|------|-------|--------|
| **Home** | `/` | ✅ Landing page |
| **Search** | `/search` | ✅ Business search (modal-based) |
| **Business Detail** | `/business/:slug` | ✅ Detail view (modal-based) |
| **Policy** | `/policy` | ✅ Terms/Privacy (modal-based) |
| **About** | `/about` | ✅ About page (4 languages) |
| **Contact** | `/contact` | ✅ Contact form (4 languages) |
| **Category Browse** | `/categories` | ✅ Category grid → search |
| **Promotion Banner** | — (home page section) | ✅ Active ads carousel with auto-slide |
| **Reviews/Ratings** | — (business detail section) | ✅ Star rating + review list |
| **User Profile** | — | 🔲 Future |
| **Favorites** | — (API ready) | ✅ Backend toggle + list + Frontend heart button (localStorage) |
| **Business Registration** | — | 🔲 Future |
| **Test Configuration** | `ng test` | ✅ Vitest + happy-dom (24 unit tests) |

---

## 6. Standards Comparison: KurdMap vs JamApi

### Architecture & Design Patterns

| Pattern | KurdMap | JamApi | Winner |
|---------|---------|--------|--------|
| **Clean Architecture** | ✅ Domain → App → Infra → API | ✅ Similar layering | 🟰 Both |
| **CQRS** | ✅ Command/Query separation with MediatR | ✅ MediatR but less strict | ✅ **KurdMap** — stricter separation |
| **Repository Pattern** | ✅ EF Core + Repository + UoW | ✅ Dapper + GenericRepository + UoW | 🟰 Both |
| **FluentValidation** | ✅ All commands validated | ❌ Manual validation classes | ✅ **KurdMap** — more maintainable |
| **Result Pattern** | ✅ Error handling without exceptions | ❌ Status code enums | ✅ **KurdMap** — cleaner |
| **Domain Events** | ✅ BusinessCreated, Verified, Deactivated | ❌ None | ✅ **KurdMap** |
| **Value Objects** | ✅ MultilingualText, Address, Coordinates | ❌ Simple entities only | ✅ **KurdMap** |
| **Factory Methods** | ✅ `Business.Create()`, `Category.Create()` | ❌ Direct constructor | ✅ **KurdMap** |
| **Pipeline Behaviors** | ✅ Validation + Logging behaviors | ❌ None | ✅ **KurdMap** |
| **Base Classes** | ✅ `BaseApiController` with Result helpers (OkOrBadRequest, OkOrNotFound, CreatedOrBadRequest, NoContentOrNotFound, ValidateRouteId) | ✅ Rich BaseApi, BaseRequest, BaseResponse | 🟰 Both |
| **Auto DI Registration** | ✅ Reflection-based auto-registration of repositories | ✅ Reflection-based auto-registration | 🟰 Both |
| **Middleware** | ✅ Exception, Security Headers, CorrelationId | ✅ Exception, Logging | ✅ **KurdMap** — more middleware |
| **Caching** | ✅ Redis (categories, cities, 30 min) | ✅ MemoryCache | ✅ **KurdMap** — Redis is better |

### Security

| Security Feature | KurdMap | JamApi | Winner |
|-----------------|---------|--------|--------|
| **Authentication** | ✅ JWT Bearer (15 min access, 7 day refresh) | ⚠️ JWT + Cookies (reflection injection) | ✅ **KurdMap** |
| **CORS** | ✅ Restricted to allowed origins | ❌ `SetIsOriginAllowed(_ => true)` — allows ALL | ✅ **KurdMap** |
| **Rate Limiting** | ✅ 3 policies (global, auth, upload) | ❌ None | ✅ **KurdMap** |
| **Security Headers** | ✅ X-Content-Type, X-Frame, HSTS, CSP | ❌ None | ✅ **KurdMap** |
| **Request Size Limits** | ✅ Default (controlled) | ❌ `int.MaxValue` / `long.MaxValue` | ✅ **KurdMap** |
| **Input Validation** | ✅ FluentValidation + Pipeline Behavior | ⚠️ Manual validation (some SQL injection risks) | ✅ **KurdMap** |
| **SQL Injection Protection** | ✅ EF Core parameterized queries | ⚠️ Dapper `GetList($"where X={value}")` — **VULNERABLE** | ✅ **KurdMap** |
| **Password Hashing** | ✅ ASP.NET Identity (PBKDF2) | ✅ ASP.NET Identity | 🟰 Both |

### Code Quality

| Aspect | KurdMap | JamApi | Winner |
|--------|---------|--------|--------|
| **ORM** | ✅ EF Core (type-safe, migrations) | ⚠️ Dapper (fast but raw SQL risk) | ✅ **KurdMap** for safety |
| **Database** | ✅ PostgreSQL + UUID + snake_case | ⚠️ SQL Server + int IDs | ✅ **KurdMap** |
| **Soft Deletes** | ✅ Status column pattern | ❌ Hard deletes | ✅ **KurdMap** |
| **Multilingual** | ✅ 4 languages (Ku, Kmr, De, En) columns | ❌ Single language | ✅ **KurdMap** |
| **API Versioning** | ✅ `/api/v1/` prefix | ❌ `/api/[controller]/[action]` | ✅ **KurdMap** |
| **Logging** | ✅ Serilog structured logging | ⚠️ Custom file-based logging | ✅ **KurdMap** |
| **Swagger** | ✅ OpenAPI with JWT auth | ✅ Swagger | 🟰 Both |
| **Health Checks** | ✅ `/health` endpoint (PostgreSQL + Redis) | ✅ HealthCheck background service | 🟰 Both |
| **File Upload** | ✅ Validated (extension + size + GUID naming) | ✅ CDN integration | 🟰 Both |

### Test Coverage

| Test Type | KurdMap | JamApi |
|-----------|---------|--------|
| Backend Unit Tests | ✅ 77 tests (xUnit + NSubstitute) | ❌ None found |
| Backend Integration Tests | ✅ 13 integration tests (WebApplicationFactory + InMemory) | ❌ None found |
| Admin Panel Unit Tests | ✅ 59 tests (all passing) | — |
| Frontend Unit Tests | ✅ 24 tests (Vitest + happy-dom) | — |
| E2E Tests | ✅ Playwright configured (3 spec files) | ❌ Not found |

---

## 7. Missing Features & Roadmap

### 🔴 High Priority (Missing CRUD)

| # | Feature | Backend | Admin | Frontend | Effort |
|---|---------|---------|-------|----------|--------|
| 1 | Cities CRUD (Create, Update, Delete) | ✅ | ✅ | — | Medium |
| 2 | MenuItems CRUD for businesses | ✅ | ✅ | ❌ | Medium |
| 3 | BusinessServices CRUD | ✅ | ✅ | ❌ | Medium |
| 4 | Delete Category endpoint + UI | ✅ | ✅ | — | Small |
| 5 | Business form: client-side categoryId/cityId validation | — | ✅ | — | Small |

### 🟡 Medium Priority (New Features)

| # | Feature | Backend | Admin | Frontend | Effort |
|---|---------|---------|-------|----------|--------|
| 6 | Reviews & Ratings system | ✅ | ✅ | ✅ | ~~Large~~ Done |
| 7 | Favorites / Bookmarks | ✅ | — | ✅ UI | ~~Medium~~ Done |
| 8 | User Profile page (frontend) | ❌ | — | ❌ | Medium |
| 9 | Business owner registration flow | ❌ | — | ❌ | Large |
| 10 | About page (frontend) | — | — | ✅ | Small |
| 11 | Contact page (frontend) | — | — | ✅ | Small |
| 12 | Category browse page (frontend) | — | — | ✅ | Medium |
| 13 | Reports / Analytics in admin | ✅ | ✅ | — | ~~Large~~ Done |
| 14 | Settings page in admin | ✅ | ✅ | — | ~~Medium~~ Done |

### 🟢 Low Priority (Quality & Testing)

| # | Feature | Status | Effort |
|---|---------|--------|--------|
| 15 | Backend unit tests (Domain + Application) | ✅ 77 tests | ~~Large~~ Done |
| 16 | Backend integration tests (API) | ✅ 13 tests | ~~Large~~ Done |
| 17 | Frontend unit test configuration | ✅ 24 tests | ~~Small~~ Done |
| 18 | Frontend E2E tests (Cypress/Playwright) | ✅ | Large |
| 19 | Health check endpoint (`/health`) | ✅ PostgreSQL + Redis | Small |
| 20 | Auto DI registration (like JamApi) | ✅ Reflection-based | Small |

---

## 8. Ideas from JamApi for KurdMap

### ✅ Good Ideas to Adopt

| # | Idea | JamApi Pattern | How to Apply in KurdMap |
|---|------|---------------|------------------------|
| 1 | **Auto-registration of repositories** | `InfrastructureConfig.cs` scans assemblies for `*Repository` classes and registers them by convention | Add to `DependencyInjection.cs` in Infrastructure — scan for `IRepository` implementations |
| 2 | **BaseRequest with context injection** | `BaseApi.OnActionExecuting()` sets BranchId, Language, CurrentUser, BrowserIp automatically | Create `IRequestContext` populated in middleware, inject into handlers |
| 3 | **Structured error response format** | `BaseMessageResponse` with StatusCode, Message, Success, ServerCurrentDate | KurdMap's Result pattern is better, but add `ServerTimestamp` to error responses |
| 4 | **Health check background service** | `HealthCheck` hosted service monitors system health | Add `/health` endpoint using `Microsoft.Extensions.Diagnostics.HealthChecks` |
| 5 | **Generic CRUD base handler** | Common pattern for FetchList/Add/Update/Delete handlers | Create `BaseCrudHandler<TEntity, TCreateCommand, TUpdateCommand>` for simpler entities |
| 6 | **Collection helper for pagination** | `CollectionHelper` encapsulates page, size, sort, filters | KurdMap already has `PaginatedList<T>` — enhance with sort/filter builder |
| 7 | **Activity logging** | `AddActivityLog()` in BaseUtilityHandler logs user actions | Add audit trail: who created/updated/deleted what and when |
| 8 | **Request/Response logging middleware** | `LoggingMiddleware` logs request body + response body | Add optional request body logging to Serilog configuration |

### ❌ Anti-Patterns to Avoid (Found in JamApi)

| # | Anti-Pattern | JamApi Code | Why to Avoid |
|---|-------------|-------------|-------------|
| 1 | **SQL Injection risk** | `GetList($"where ProvinceId={request.ProvinceId}")` | String interpolation in SQL — use parameterized queries |
| 2 | **Open CORS** | `SetIsOriginAllowed(_ => true)` | Allows any origin — security risk |
| 3 | **Unlimited request size** | `MaxRequestBodySize = long.MaxValue` | DoS vector — keep reasonable limits |
| 4 | **No rate limiting** | Not implemented | Allows brute-force attacks |
| 5 | **Reflection-based param injection** | `BaseApi.OnActionExecuting()` uses reflection to set properties | Fragile, hard to debug — prefer explicit DI |
| 6 | **Singleton repositories** | Some services registered as `Singleton` | Database connections should be `Scoped` |
| 7 | **No FluentValidation** | Manual if/else validation chains | Hard to maintain, inconsistent |
| 8 | **Exception middleware returns 200** | `context.Response.StatusCode = (int)HttpStatusCode.OK` on errors | Always return proper HTTP status codes |

---

## Summary Score

| Category | KurdMap Score | JamApi Score |
|----------|:------------:|:------------:|
| Architecture | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Security | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Code Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Test Coverage | ⭐⭐⭐⭐ | ⭐ |
| Feature Completeness | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Reusability (Base Classes) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| DevOps & CI/CD | ⭐⭐⭐⭐ | ⭐⭐ |
| SEO & Performance | ⭐⭐⭐⭐ | ⭐⭐ |

**KurdMap has achieved enterprise-level architecture with comprehensive features. 173 total tests (90 backend xUnit + 59 Angular Admin Vitest + 24 Angular Frontend Vitest), full CI/CD pipeline, Reviews & Favorites systems, Reports dashboard, enhanced SEO (JSON-LD, OG tags, Twitter cards), Docker/Podman deployment with EF Core auto-migration (2 migrations: InitialCreate + AddReviewsAdvertisementsFavorites), test data seeding via `make seed`, skeleton table loading, empty states with SVG illustrations, and CSV export. Dark mode is complete across all admin pages.**

---

## 9. Complete Roadmap — All Phases

### ✅ Phase 1 — Audit & Debug (Completed)
| Task | Status |
|------|--------|
| Full solution build validation | ✅ |
| Admin panel test run (47 tests) | ✅ |
| Business add flow analysis | ✅ |
| Client-side validation fix (categoryId, cityId) | ✅ |
| KurdMap vs JamApi comparison | ✅ |
| Checklist document created | ✅ |

### ✅ Phase 2 — Missing CRUD Features (Completed)
| Task | Status |
|------|--------|
| Cities CRUD (Backend + Admin) | ✅ |
| Delete Category (Backend + Admin) | ✅ |
| MenuItems CRUD (Backend + Admin Tab) | ✅ |
| BusinessServices CRUD (Backend + Admin Tab) | ✅ |
| Business form validation fix | ✅ |

### ✅ Phase 3 — Reusability & Architecture (Completed)
| Task | Status |
|------|--------|
| BaseApiController with 5 DRY helpers | ✅ |
| Refactored all 5 controllers to use BaseApiController | ✅ |
| Auto DI Registration (reflection-based) | ✅ |
| IRequestContext + RequestContext middleware | ✅ |
| Health Checks (PostgreSQL + Redis) | ✅ |
| Frontend routes: About, Contact, Categories pages | ✅ |
| Frontend test configuration (Vitest) | ✅ |
| i18n for all 4 languages (de, ku, kmr, en) | ✅ |
| Header/Footer navigation links | ✅ |

### ✅ Phase 4 — Advertisement / Reklame Feature (Completed)
| Task | Status |
|------|--------|
| Advertisement domain entity with factory, Update, Toggle | ✅ |
| IAdvertisementRepository interface | ✅ |
| CQRS: Create, Update, Delete, Toggle, GetAll | ✅ |
| FluentValidation for CreateAdvertisement | ✅ |
| AdvertisementRepository (EF Core) | ✅ |
| AdvertisementConfiguration (EF Core, indexes) | ✅ |
| AppDbContext updated with DbSet | ✅ |
| AdvertisementsController (5 endpoints) | ✅ |
| Admin panel: Advertisements management page (full CRUD + toggle) | ✅ |
| Admin sidebar: ‌"ڕیکلام" navigation item | ✅ |
| Frontend: Promotion banner component (auto-slide carousel) | ✅ |
| API service methods (admin + frontend) | ✅ |
| Unit tests: 6 advertisement API tests | ✅ |
| All builds passing (Backend + Admin + Frontend) | ✅ |
| Total tests: 53/53 passing | ✅ |

### ✅ Phase 5 — Reviews & Ratings System (Completed)
| Task | Status |
|------|--------|
| Review entity (Domain) + factory method | ✅ |
| Star rating (1-5) + comment text | ✅ |
| CQRS: CreateReview, ApproveReview, DeleteReview, GetReviews, GetAllReviews | ✅ |
| CreateReviewCommandValidator (FluentValidation) | ✅ |
| ReviewRepository (EF Core) + ReviewConfiguration | ✅ |
| ReviewsController (5 endpoints) | ✅ |
| Frontend: Star rating component (reusable) | ✅ |
| Frontend: Review list on business detail page | ✅ |
| Admin: Review moderation page (approve/reject/delete) | ✅ |
| Admin sidebar: "هەڵسەنگاندن" navigation item | ✅ |
| API service methods (getReviews, approveReview, deleteReview) | ✅ |
| Unit tests: 6 review API tests (Angular) | ✅ |
| Unit tests: 8 review domain + 8 handler tests (.NET) | ✅ |

### ✅ Phase 6 — Favorites System (Completed)
| Task | Status |
|------|--------|
| Favorite entity (Domain) + factory method | ✅ |
| IFavoriteRepository interface | ✅ |
| CQRS: ToggleFavorite, GetUserFavorites | ✅ |
| FavoriteRepository (EF Core) + FavoriteConfiguration | ✅ |
| FavoritesController (2 endpoints, Auth required) | ✅ |
| AppDbContext updated with DbSet<Favorite> | ✅ |
| Unit tests: 2 domain + 3 handler tests (.NET) | ✅ |

### ✅ Phase 7 — Reports Dashboard (Completed)
| Task | Status |
|------|--------|
| Reports page with business status distribution | ✅ |
| Review analytics (rating chart, average rating) | ✅ |
| Recent reviews list with moderation badges | ✅ |
| Admin sidebar: "ڕاپۆرتەکان" navigation item | ✅ |
| Admin route: `/reports` | ✅ |

### ✅ Phase 8 — Testing & Quality (Completed)
| Task | Status |
|------|--------|
| .NET xUnit test project (KurdMap.Tests) | ✅ |
| NSubstitute mocking library | ✅ |
| Domain unit tests: ReviewTests (8 tests) | ✅ |
| Domain unit tests: FavoriteTests (2 tests) | ✅ |
| Application unit tests: ReviewHandlerTests (8 tests) | ✅ |
| Application unit tests: FavoriteHandlerTests (3 tests) | ✅ |
| Angular admin tests: api.service.reviews.spec.ts (6 tests) | ✅ |
| Total 86 tests across backend + admin (all passing) | ✅ |

### ✅ Phase 9 — DevOps & CI/CD (Completed)
| Task | Status |
|------|--------|
| Docker Compose (PostgreSQL, Redis, API, Admin, Frontend) | ✅ (pre-existing) |
| CI/CD pipeline: `.github/workflows/ci.yml` | ✅ |
| Backend job: .NET restore, build, test | ✅ |
| Admin job: npm ci, lint, test, build | ✅ |
| Frontend job: npm ci, build | ✅ |
| Docker job: build 3 images on main branch | ✅ |

### ✅ Phase 11 — Database Migrations & Podman Seed (Completed)
| Task | Status |
|------|--------|
| EF Core Migration: `InitialCreate` (categories, cities, businesses, Identity tables) | ✅ |
| EF Core Migration: `AddReviewsAdvertisementsFavorites` (reviews, advertisements, favorites) | ✅ |
| Auto-migration on API startup (`MigrateDatabaseAsync` with retry + backoff) | ✅ |
| Seed SQL script (`docker/seed-data.sql`) with correct PascalCase column names | ✅ |
| Makefile targets: `make seed`, `make db-reset` | ✅ |
| Podman-compose verified: all 5 services up, migrations applied, all endpoints 200 | ✅ |
| Test data: 8 businesses, 3 menu items, 2 services, 3 ads, 6 reviews, 3 favorites | ✅ |

### ✅ Phase 10 — SEO & Performance (Completed)
| Task | Status |
|------|--------|
| Enhanced SeoService: OG tags, Twitter cards, canonical URLs | ✅ |
| JSON-LD structured data (LocalBusiness schema.org) | ✅ |
| Business detail: full SEO + structured data | ✅ |
| HTML meta tags: theme-color, robots, og:site_name | ✅ |
| robots.txt with sitemap reference | ✅ |
| sitemap.xml with hreflang alternates (4 languages) | ✅ |
| Frontend SSR (Server-Side Rendering) | ✅ (pre-existing) |
| Lazy loading routes (all pages) | ✅ (pre-existing) |

### ✅ Phase 12 — UI/UX & Accessibility WCAG 2.2 AA (Completed)

#### Admin Panel — Accessibility
| Task | Status |
|------|--------|
| Skip-to-main-content link (`sr-only focus:not-sr-only`) | ✅ |
| `scope="col"` on all table headers (7 tables) | ✅ |
| `<caption>` on all data tables (7 tables) | ✅ |
| `aria-label` on all icon-only action buttons | ✅ |
| `<label>` for filter `<select>` elements (businesses, users) | ✅ |
| Touch targets ≥ 44px (`min-h-11 min-w-11 p-2`) on all buttons | ✅ |
| Sidebar mobile overlay with backdrop + auto-close on route change | ✅ |
| Table → Card responsive layout for mobile (6 data tables) | ✅ |
| KPI stat cards clickable with `routerLink` to detail pages | ✅ |
| Column sorting on businesses table (name, status, phone) | ✅ |
| Breadcrumb navigation component with Kurdish labels | ✅ |
| SVG donut chart on dashboard (business status distribution) | ✅ |

#### Frontend — Accessibility
| Task | Status |
|------|--------|
| `aria-label` on search input (hero + search page) | ✅ |
| `aria-label` on newsletter email input | ✅ |
| `aria-live="polite"` on search results count | ✅ |
| Translated hardcoded English `aria-label` attributes (9 locations) | ✅ |
| i18n `aria` keys added to all 4 language files (en, de, ku, kmr) | ✅ |
| Mobile bottom navigation component (`md:hidden`) | ✅ |

---

## 10. 20 New Ideas for 2026

| # | Idea | Category | Effort | Description |
|---|------|----------|--------|-------------|
| 1 | 🗺️ **Interactive Map Clustering** | Frontend | Medium | Cluster business markers on the map for better UX when zoomed out |
| 2 | 📱 **PWA & Offline Support** | Frontend | Large | Service Worker for offline access to favorite businesses, push notifications |
| 3 | ⭐ **Reviews & Ratings** | Full-Stack | Large | 1-5 star rating + text reviews, moderation dashboard in admin |
| 4 | 💖 **Favorites / Bookmarks** | Full-Stack | Medium | Users save favorite businesses, sync cross-device via account |
| 5 | 🔔 **Push Notifications** | Full-Stack | Medium | Notify users about new businesses in their area, deals, events |
| 6 | 📊 **Analytics Dashboard** | Admin | Large | Charts: visits/day, top categories, popular searches, user growth |
| 7 | 🏷️ **Coupon / Deal System** | Full-Stack | Large | Businesses post time-limited deals, visible on map + search |
| 8 | 📸 **User-Uploaded Photos** | Full-Stack | Medium | Users upload photos to businesses (moderated), photo gallery view |
| 9 | 🔍 **AI-Powered Search** | Backend | Large | Natural language search (e.g., "Kurdish restaurant near me open now") |
| 10 | 📅 **Event Calendar** | Full-Stack | Large | Businesses post events (concerts, sales, openings), calendar view on frontend |
| 11 | 🗣️ **Multi-Language Voice Search** | Frontend | Medium | Voice input in Kurdish, German, English — convert to search query |
| 12 | 📍 **"Near Me" Geofencing** | Frontend | Medium | Auto-detect user location, show closest businesses with distance |
| 13 | 💬 **Business Chat / Messaging** | Full-Stack | Large | Real-time chat between users and business owners (SignalR) |
| 14 | 🏪 **Business Claim & Verify** | Full-Stack | Medium | Business owners claim their listing, verify via phone/email |
| 15 | 📋 **Digital Menu / QR Code** | Full-Stack | Medium | Generate QR code for menu/services, customers scan at restaurant |
| 16 | 🌐 **Multi-City Expansion** | Frontend | Small | City landing pages, city-specific SEO, city comparison |
| 17 | 📈 **Business Insights for Owners** | Full-Stack | Large | Owners see: profile views, phone clicks, direction requests, call-to-action stats |
| 18 | 🎯 **Premium Business Listing** | Full-Stack | Medium | Paid premium placement: featured in search, highlighted on map, badge |
| 19 | 🤖 **Chatbot Assistant** | Frontend | Large | AI chatbot helps find businesses, navigate the site in Kurdish/German |
| 20 | 📱 **Native Mobile App (Flutter/MAUI)** | Mobile | Extra Large | Native iOS/Android app sharing the same API, push notifications, offline mode |

---

## 11. Advertisement / Reklame Feature

### Overview
Businesses or third parties can purchase advertising space to display promotional posters/banners on the KurdMap homepage. Ads are fully managed through the admin panel with date-based scheduling and activation control.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel    │────▶│   KurdMap API     │◀────│    Frontend     │
│  /advertisements │     │  /api/v1/ads      │     │  Promotion      │
│  CRUD + Toggle   │     │  CQRS Handlers    │     │  Banner Carousel│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                        ┌─────▼─────┐
                        │ PostgreSQL │
                        │ ads table  │
                        └───────────┘
```

### Backend
| Layer | Component | Description |
|-------|-----------|-------------|
| **Domain** | `Advertisement` entity | Title (multilingual), Description, ImageUrl, LinkUrl, BusinessId, StartDate, EndDate, IsActive, SortOrder |
| **Domain** | Factory: `Create()`, Methods: `Update()`, `Activate()`, `Deactivate()` | Date validation, state management |
| **Application** | `CreateAdvertisementCommand` + Validator | FluentValidation: Title.Ku + De required, ImageUrl required, EndDate > StartDate |
| **Application** | `UpdateAdvertisementCommand` | Full update with ID matching |
| **Application** | `DeleteAdvertisementCommand` | Hard delete by ID |
| **Application** | `ToggleAdvertisementCommand` | Activate/Deactivate toggle |
| **Application** | `GetAdvertisementsQuery` | Filter: `activeOnly` for public API |
| **Infrastructure** | `AdvertisementRepository` | `GetActiveAsync()` filters by IsActive + date range |
| **Infrastructure** | `AdvertisementConfiguration` | Table "advertisements", OwnsOne for Title/Description, composite index |
| **API** | `AdvertisementsController` | 5 endpoints, `BaseApiController` helpers, Admin-only create/update/delete |

### Admin Panel
| Feature | Description |
|---------|-------------|
| **Sidebar item** | "ڕیکلام" with campaign icon |
| **List view** | Table: image thumbnail, title (De/Ku), start/end date, active badge |
| **Create/Edit dialog** | Multilingual fields (4 lang), image URL, link URL, date range, sort order |
| **Toggle status** | Play/Pause button per row — activate/deactivate instantly |
| **Delete** | Confirm dialog with danger styling |

### Frontend
| Feature | Description |
|---------|-------------|
| **Promotion Banner** | Auto-slide carousel between Featured Businesses and Trust Stats sections |
| **Multilingual** | Title/Description displayed in current language |
| **Poster display** | Full-width image with gradient overlay + text |
| **Navigation dots** | Manual slide switching for multiple ads |
| **6-second rotation** | Auto-advances to next ad every 6 seconds |
| **CTA button** | "Mehr erfahren" / "زیاتر بزانە" links to target URL |

### Tests
| Test | Description |
|------|-------------|
| `getAdvertisements(false)` | Fetches all ads with activeOnly=false |
| `getAdvertisements(true)` | Fetches only active ads |
| `createAdvertisement()` | POST with correct payload |
| `updateAdvertisement()` | PUT with ID in URL |
| `toggleAdvertisement()` | PUT with activate boolean |
| `deleteAdvertisement()` | DELETE by ID |

---

## 12. Featured / Suggested Business Feature

### Overview
Admin users can manually mark businesses as "featured" (پیشنیارکراو / Empfohlen) so they appear prominently in search results with a golden star badge. This is a toggle action — no scheduling, just on/off.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel    │────▶│   KurdMap API     │◀────│    Frontend     │
│  Star toggle     │     │  POST toggle-     │     │  Golden badge   │
│  per business    │     │  featured         │     │  on cards       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Backend
| Layer | Component | Description |
|-------|-----------|-------------|
| **Domain** | `Business.IsFeatured` | New `bool` property on Business entity |
| **Domain** | `Business.SetFeatured(bool)` | Method to toggle featured status |
| **Application** | `ToggleFeaturedCommand` | CQRS command, same pattern as VerifyBusiness |
| **Application** | `ToggleFeaturedCommandHandler` | Loads business, toggles IsFeatured, saves |
| **Application** | DTOs: `BusinessSummaryDto`, `BusinessDetailDto` | Both include `IsFeatured` field |
| **Application** | `BusinessMappings` | `ToSummaryDto()` and `ToDetailDto()` map `IsFeatured` |
| **API** | `POST /api/v1/businesses/{id}/toggle-featured` | Admin-only endpoint (SuperAdmin, Admin) |
| **Infrastructure** | EF Migration `AddIsFeaturedToBusiness` | Adds `IsFeatured` bool column, default false |

### Admin Panel
| Feature | Description |
|---------|-------------|
| **Table column** | "پیشنیارکراو" header with star icon toggle button per row |
| **Toggle button** | Amber star (featured) or gray star outline (normal), instant toggle |
| **API service** | `toggleFeatured(id)` → POST to toggle-featured endpoint |
| **Notifications** | Success/error feedback on toggle |

### Frontend
| Feature | Description |
|---------|-------------|
| **Business card badge** | Golden amber star badge with "Featured" text (translated to 4 languages) |
| **i18n** | `business.featured`: "Featured" / "Empfohlen" / "پیشنیارکراو" / "Pêşniyarkirî" |
| **Business detail** | Featured badge displayed in hero section floating badges |

### Seed Data
| Business | Featured |
|----------|----------|
| Restaurant Kurdistan Köln | ⭐ Yes |
| Bazar Azadi Köln | ⭐ Yes |
| All others | No |
