# 🏗️ System Architecture – KurdMap

## 1. Architecture Overview

KurdMap uses a **Service-Oriented Architecture** with three independently deployable services communicating through a REST API. This separation enables independent development, deployment, and scaling of each service.

### 1.1 Architecture Decision: Service-Oriented vs. Alternatives

| Approach | Pros | Cons | Decision |
|----------|------|------|:--------:|
| **3 Services (API + Frontend + Admin)** | Clear separation, independent deployment, team autonomy | Network overhead between services | ✅ Chosen |
| Monolith (all-in-one) | Simple deployment, no network latency | Tight coupling, single point of failure | ❌ |
| Microservices | Maximum scalability, polyglot | Over-engineering for this scope, DevOps complexity | ❌ |
| Serverless | Auto-scaling, pay-per-use | Cold starts, vendor lock-in, state management | ❌ |

---

## 2. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        ANG[Angular 19+ SPA<br/>Public Website<br/>SSR + CSR]
        BLZ[Blazor Server<br/>Admin Panel<br/>SignalR Connection]
        MOB[Future: Mobile App<br/>PWA / MAUI]
        EXT[External Clients<br/>REST API]
    end

    subgraph "Reverse Proxy"
        NGX[Nginx<br/>SSL Termination<br/>Rate Limiting<br/>Static Files]
    end

    subgraph "Application Layer"
        API[ASP.NET Core 10<br/>REST API<br/>JWT Authentication]
    end

    subgraph "Application Internals"
        direction TB
        subgraph "API Layer"
            CTRL[Controllers]
            MW[Middleware<br/>Exception, Logging, CORS]
            FILT[Filters]
        end
        subgraph "Application Layer – CQRS"
            CMD[Commands<br/>Create, Update, Delete]
            QRY[Queries<br/>Search, GetBySlug, List]
            VAL[Validators<br/>FluentValidation]
            BHV[Pipeline Behaviors<br/>Validation, Logging, Performance]
        end
        subgraph "Domain Layer"
            ENT[Entities<br/>Business, Category, City, User]
            VO[Value Objects<br/>Address, Coordinates, MultilingualText]
            EVT[Domain Events<br/>BusinessCreated, BusinessVerified]
            REPO_I[Repository Interfaces]
        end
        subgraph "Infrastructure Layer"
            EF[EF Core 10<br/>DbContext]
            REPO[Repositories<br/>BusinessRepository, etc.]
            SVC[Services<br/>Image, Cache, Search]
            IDENT[ASP.NET Identity<br/>JWT Token Service]
        end
    end

    subgraph "Data Layer"
        PG[(PostgreSQL 16+<br/>Primary Database)]
        REDIS[(Redis<br/>Caching & Sessions)]
        FS[Local File System<br/>Business Images]
    end

    ANG --> NGX
    BLZ --> NGX
    MOB --> NGX
    EXT --> NGX
    NGX --> API
    API --> CTRL
    CTRL --> CMD
    CTRL --> QRY
    CMD --> VAL
    QRY --> VAL
    CMD --> BHV
    QRY --> BHV
    CMD --> ENT
    QRY --> REPO_I
    REPO_I -.-> REPO
    REPO --> EF
    EF --> PG
    SVC --> REDIS
    SVC --> FS
    IDENT --> PG
```

---

## 3. Clean Architecture – Layer Model

```mermaid
graph TB
    subgraph "Presentation Layer"
        P1[API Controllers]
        P2[Middleware]
        P3[Filters & Extensions]
    end

    subgraph "Application Layer"
        A1[Commands / Queries – CQRS]
        A2[Command Handlers]
        A3[Query Handlers]
        A4[Validators – FluentValidation]
        A5[DTOs / ViewModels]
        A6[Mapping Profiles]
        A7[Interfaces]
        A8[Pipeline Behaviors]
    end

    subgraph "Domain Layer – Core"
        D1[Entities]
        D2[Value Objects]
        D3[Enums]
        D4[Domain Events]
        D5[Repository Interfaces]
        D6[Domain Exceptions]
    end

    subgraph "Infrastructure Layer"
        I1[EF Core DbContext]
        I2[Entity Configurations]
        I3[Repository Implementations]
        I4[Image Service]
        I5[Cache Service – Redis]
        I6[Search Service – PostgreSQL FTS]
        I7[Identity & JWT Service]
        I8[Seed Data]
    end

    P1 --> A1
    A1 --> A2
    A1 --> A3
    A2 --> D5
    A3 --> D5
    A2 --> D4
    D5 -.-> I3
    A7 -.-> I4
    A7 -.-> I5
    A7 -.-> I6

    style D1 fill:#e1f5fe
    style D2 fill:#e1f5fe
    style D3 fill:#e1f5fe
    style D4 fill:#e1f5fe
    style D5 fill:#e1f5fe
    style D6 fill:#e1f5fe
```

### Dependency Rule

> **Domain has ZERO external dependencies.** Application depends only on Domain. Infrastructure implements interfaces defined in Domain/Application. API wires everything together via DI.

```mermaid
graph LR
    API[KurdMap.API] --> APP[KurdMap.Application]
    API --> INFRA[KurdMap.Infrastructure]
    APP --> DOM[KurdMap.Domain]
    INFRA --> DOM
    INFRA --> APP
    ADMIN[KurdMap.AdminPanel] --> SHARED[KurdMap.Shared]
    API --> SHARED
    FRONTEND[kurdmap-frontend] -->|HTTP| API

    style DOM fill:#2196f3,color:#fff
    style APP fill:#4caf50,color:#fff
    style INFRA fill:#ff9800,color:#fff
    style API fill:#e53935,color:#fff
    style ADMIN fill:#9c27b0,color:#fff
    style FRONTEND fill:#00bcd4,color:#fff
    style SHARED fill:#fdd835
```

---

## 4. Project Structure

```
KurdMap-web-all/
├── src/
│   ├── KurdMap.Domain/                        # Domain Layer (ZERO dependencies)
│   │   ├── Common/
│   │   │   ├── BaseEntity.cs                  # Id (Guid), CreatedAt, UpdatedAt
│   │   │   ├── AuditableEntity.cs             # CreatedBy, UpdatedBy
│   │   │   ├── ValueObject.cs                 # Base class for value objects
│   │   │   └── IDomainEvent.cs
│   │   ├── Businesses/
│   │   │   ├── Entities/
│   │   │   │   ├── Business.cs                # Aggregate root
│   │   │   │   ├── BusinessImage.cs
│   │   │   │   ├── BusinessService.cs
│   │   │   │   └── MenuItem.cs
│   │   │   ├── ValueObjects/
│   │   │   │   ├── Address.cs
│   │   │   │   ├── Coordinates.cs
│   │   │   │   ├── MultilingualText.cs
│   │   │   │   └── OpeningHours.cs
│   │   │   ├── Events/
│   │   │   │   ├── BusinessCreatedEvent.cs
│   │   │   │   ├── BusinessVerifiedEvent.cs
│   │   │   │   └── BusinessDeactivatedEvent.cs
│   │   │   └── IBusinessRepository.cs
│   │   ├── Categories/
│   │   │   ├── Entities/
│   │   │   │   └── Category.cs
│   │   │   └── ICategoryRepository.cs
│   │   ├── Cities/
│   │   │   ├── Entities/
│   │   │   │   └── City.cs
│   │   │   └── ICityRepository.cs
│   │   ├── Users/
│   │   │   ├── Entities/
│   │   │   │   └── ApplicationUser.cs
│   │   │   └── IUserRepository.cs
│   │   └── Enums/
│   │       ├── BusinessStatus.cs              # Pending, Active, Rejected, Deactivated
│   │       └── UserRole.cs                    # SuperAdmin, Admin, Moderator, BusinessOwner, User
│   │
│   ├── KurdMap.Application/                   # Application Layer
│   │   ├── Common/
│   │   │   ├── Behaviors/
│   │   │   │   ├── ValidationBehavior.cs
│   │   │   │   ├── LoggingBehavior.cs
│   │   │   │   └── PerformanceBehavior.cs
│   │   │   ├── Interfaces/
│   │   │   │   ├── IApplicationDbContext.cs
│   │   │   │   ├── ICurrentUserService.cs
│   │   │   │   ├── IImageService.cs
│   │   │   │   ├── ICacheService.cs
│   │   │   │   └── ISearchService.cs
│   │   │   ├── Mappings/
│   │   │   │   └── MappingProfile.cs
│   │   │   ├── Models/
│   │   │   │   ├── Result.cs
│   │   │   │   └── PaginatedList.cs
│   │   │   └── Exceptions/
│   │   │       ├── ValidationException.cs
│   │   │       ├── NotFoundException.cs
│   │   │       └── ForbiddenAccessException.cs
│   │   ├── Businesses/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateBusiness/
│   │   │   │   │   ├── CreateBusinessCommand.cs
│   │   │   │   │   ├── CreateBusinessCommandHandler.cs
│   │   │   │   │   └── CreateBusinessCommandValidator.cs
│   │   │   │   ├── UpdateBusiness/
│   │   │   │   ├── DeleteBusiness/
│   │   │   │   ├── VerifyBusiness/
│   │   │   │   └── UploadBusinessImage/
│   │   │   ├── Queries/
│   │   │   │   ├── GetBusinessBySlug/
│   │   │   │   ├── SearchBusinesses/
│   │   │   │   └── GetBusinessesByCategory/
│   │   │   ├── DTOs/
│   │   │   │   ├── BusinessDetailDto.cs
│   │   │   │   ├── BusinessSummaryDto.cs
│   │   │   │   └── BusinessListDto.cs
│   │   │   └── EventHandlers/
│   │   │       ├── BusinessCreatedEventHandler.cs
│   │   │       └── BusinessVerifiedEventHandler.cs
│   │   ├── Categories/
│   │   │   ├── Queries/
│   │   │   └── DTOs/
│   │   ├── Cities/
│   │   │   ├── Queries/
│   │   │   └── DTOs/
│   │   └── DependencyInjection.cs
│   │
│   ├── KurdMap.Infrastructure/                # Infrastructure Layer
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/
│   │   │   │   ├── BusinessConfiguration.cs
│   │   │   │   ├── BusinessImageConfiguration.cs
│   │   │   │   ├── BusinessServiceConfiguration.cs
│   │   │   │   ├── MenuItemConfiguration.cs
│   │   │   │   ├── CategoryConfiguration.cs
│   │   │   │   ├── CityConfiguration.cs
│   │   │   │   └── UserConfiguration.cs
│   │   │   ├── Migrations/
│   │   │   ├── Repositories/
│   │   │   │   ├── BusinessRepository.cs
│   │   │   │   ├── CategoryRepository.cs
│   │   │   │   ├── CityRepository.cs
│   │   │   │   └── UnitOfWork.cs
│   │   │   ├── Interceptors/
│   │   │   │   ├── AuditableEntityInterceptor.cs
│   │   │   │   └── SoftDeleteInterceptor.cs
│   │   │   └── Seed/
│   │   │       ├── CategorySeed.cs
│   │   │       ├── CitySeed.cs
│   │   │       └── AdminUserSeed.cs
│   │   ├── Services/
│   │   │   ├── ImageService.cs
│   │   │   ├── CacheService.cs
│   │   │   ├── SearchService.cs
│   │   │   └── CurrentUserService.cs
│   │   ├── Identity/
│   │   │   ├── IdentityService.cs
│   │   │   └── JwtTokenService.cs
│   │   └── DependencyInjection.cs
│   │
│   ├── KurdMap.API/                           # API Layer (Entry Point)
│   │   ├── Controllers/
│   │   │   ├── BusinessesController.cs
│   │   │   ├── CategoriesController.cs
│   │   │   ├── CitiesController.cs
│   │   │   ├── AuthController.cs
│   │   │   ├── ImagesController.cs
│   │   │   └── AdminController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── CorrelationIdMiddleware.cs
│   │   ├── Filters/
│   │   │   └── ApiExceptionFilterAttribute.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── Program.cs
│   │
│   ├── KurdMap.Shared/                        # Shared DTOs & Contracts
│   │   ├── DTOs/
│   │   │   ├── BusinessDto.cs
│   │   │   ├── CategoryDto.cs
│   │   │   ├── CityDto.cs
│   │   │   └── AuthDto.cs
│   │   ├── Constants/
│   │   │   └── Roles.cs
│   │   └── Enums/
│   │       └── BusinessStatus.cs
│   │
│   ├── KurdMap.AdminPanel/                    # Blazor Server Admin Panel
│   │   ├── Pages/
│   │   │   ├── Dashboard.razor
│   │   │   ├── Businesses/
│   │   │   │   ├── BusinessList.razor
│   │   │   │   ├── BusinessForm.razor
│   │   │   │   └── BusinessDetail.razor
│   │   │   ├── Users/
│   │   │   │   └── UserList.razor
│   │   │   ├── Categories/
│   │   │   │   └── CategoryManagement.razor
│   │   │   └── Settings/
│   │   │       └── SiteSettings.razor
│   │   ├── Components/
│   │   │   ├── Layout/
│   │   │   │   ├── MainLayout.razor
│   │   │   │   └── NavMenu.razor
│   │   │   └── Shared/
│   │   │       ├── MultilingualInput.razor
│   │   │       ├── ImageUpload.razor
│   │   │       └── ConfirmDialog.razor
│   │   ├── Services/
│   │   │   ├── ApiClient.cs
│   │   │   └── AuthService.cs
│   │   ├── wwwroot/
│   │   └── Program.cs
│   │
│   └── kurdmap-frontend/                      # Angular 19+ Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/
│       │   │   │   ├── services/
│       │   │   │   │   ├── business.service.ts
│       │   │   │   │   ├── category.service.ts
│       │   │   │   │   ├── city.service.ts
│       │   │   │   │   └── auth.service.ts
│       │   │   │   ├── interceptors/
│       │   │   │   │   ├── auth.interceptor.ts
│       │   │   │   │   └── error.interceptor.ts
│       │   │   │   ├── guards/
│       │   │   │   │   └── auth.guard.ts
│       │   │   │   └── models/
│       │   │   │       ├── business.model.ts
│       │   │   │       ├── category.model.ts
│       │   │   │       └── paginated-list.model.ts
│       │   │   ├── features/
│       │   │   │   ├── home/
│       │   │   │   │   ├── home.component.ts
│       │   │   │   │   └── home.routes.ts
│       │   │   │   ├── search/
│       │   │   │   │   ├── search.component.ts
│       │   │   │   │   ├── search-filters.component.ts
│       │   │   │   │   ├── search-map.component.ts
│       │   │   │   │   └── search.routes.ts
│       │   │   │   ├── business-detail/
│       │   │   │   │   ├── business-detail.component.ts
│       │   │   │   │   ├── business-gallery.component.ts
│       │   │   │   │   ├── business-map.component.ts
│       │   │   │   │   └── business-detail.routes.ts
│       │   │   │   └── contact/
│       │   │   ├── shared/
│       │   │   │   ├── components/
│       │   │   │   │   ├── header/
│       │   │   │   │   ├── footer/
│       │   │   │   │   ├── language-switcher/
│       │   │   │   │   ├── business-card/
│       │   │   │   │   └── loading-skeleton/
│       │   │   │   ├── directives/
│       │   │   │   │   └── rtl.directive.ts
│       │   │   │   └── pipes/
│       │   │   │       └── multilingual.pipe.ts
│       │   │   └── app.routes.ts
│       │   ├── assets/
│       │   │   ├── i18n/
│       │   │   │   ├── ku-sor.json
│       │   │   │   ├── ku-kur.json
│       │   │   │   ├── de.json
│       │   │   │   ├── en.json
│       │   │   │   └── fa.json
│       │   │   └── images/
│       │   ├── environments/
│       │   └── styles/
│       │       ├── styles.scss
│       │       └── _rtl.scss
│       ├── angular.json
│       ├── tailwind.config.js
│       └── package.json
│
├── tests/
│   ├── KurdMap.Domain.Tests/
│   │   └── Businesses/
│   ├── KurdMap.Application.Tests/
│   │   └── Businesses/
│   │       ├── Commands/
│   │       └── Queries/
│   ├── KurdMap.Infrastructure.Tests/
│   └── KurdMap.API.Tests/
│       └── Controllers/
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.override.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.admin
│   └── Dockerfile.frontend
│
├── Docs/
│   └── Plan/
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   ├── skills/
│   │   └── prompt/
│   │       └── SKILL.md
│   └── prompts/
│       └── p.prompt.md
│
├── KurdMap.sln
├── .gitignore
├── .editorconfig
└── README.md
```

---

## 5. Component Diagram

```mermaid
graph LR
    subgraph "Angular Frontend Components"
        HC[Home Page]
        SC[Search Page]
        BDC[Business Detail]
        CC[Contact Page]
        LS[Language Switcher]
    end

    subgraph "API Endpoints"
        BA[/api/businesses]
        CA[/api/categories]
        CIA[/api/cities]
        AA[/api/auth]
        IA[/api/images]
        ADMA[/api/admin]
    end

    subgraph "Blazor Admin Pages"
        DASH[Dashboard]
        BM[Business Management]
        UM[User Management]
        CM[Category Management]
    end

    SC --> BA
    SC --> CA
    SC --> CIA
    BDC --> BA
    HC --> CA
    HC --> BA
    DASH --> ADMA
    BM --> BA
    BM --> IA
    UM --> ADMA
    CM --> CA
```

---

## 6. Request Flow (Search Example)

```mermaid
sequenceDiagram
    actor User
    participant Angular as Angular Frontend
    participant Nginx as Nginx Proxy
    participant API as ASP.NET Core API
    participant MediatR as MediatR Pipeline
    participant Handler as SearchBusinessesHandler
    participant DB as PostgreSQL

    User->>Angular: Search "Kurdish Restaurant Köln"
    Angular->>Nginx: GET /api/businesses?search=restaurant&city=koeln
    Nginx->>API: Forward request
    API->>API: JWT Validation (optional for public)
    API->>MediatR: Send(SearchBusinessesQuery)
    MediatR->>MediatR: ValidationBehavior
    MediatR->>MediatR: LoggingBehavior
    MediatR->>Handler: Handle(query)
    Handler->>DB: SELECT with filters, pagination, FTS
    DB-->>Handler: Business rows
    Handler->>Handler: Map to BusinessSummaryDto
    Handler-->>MediatR: PaginatedList<BusinessSummaryDto>
    MediatR-->>API: Result
    API-->>Nginx: 200 OK + JSON
    Nginx-->>Angular: Response
    Angular->>Angular: Render cards + map markers
    Angular-->>User: Display results
```

---

## 7. Technology Alternatives Summary

| Component | Chosen | Alternative 1 | Alternative 2 | Alternative 3 |
|-----------|--------|--------------|--------------|---------------|
| **Runtime** | ASP.NET Core 10 | Node.js | Go | Spring Boot |
| **ORM** | EF Core 10 | Dapper | Npgsql (raw) | LINQ to DB |
| **CQRS** | MediatR | No library (manual) | Wolverine | Brighter |
| **Validation** | FluentValidation | Data Annotations | Manual | |
| **Mapping** | Mapster | AutoMapper | Manual mapping | |
| **Logging** | Serilog | NLog | Built-in ILogger | |
| **Caching** | Redis | IMemoryCache | NCache | |
| **Search** | PostgreSQL FTS | Elasticsearch | Algolia | Meilisearch |
| **Auth** | JWT + Identity | Keycloak | Auth0 | IdentityServer |
| **Frontend** | Angular 19+ | React (Next.js) | Vue (Nuxt) | Svelte |
| **UI Library** | Tailwind CSS | Angular Material | PrimeNG | Bootstrap |
| **Maps** | Leaflet + OSM | Google Maps API | Mapbox | |
| **Admin UI** | MudBlazor | FluentUI Blazor | Radzen | |
| **Database** | PostgreSQL 16+ | SQL Server | MySQL | MongoDB |
| **Container** | Docker + Compose | Podman | Kubernetes | |
| **CI/CD** | GitHub Actions | GitLab CI | Azure DevOps | Jenkins |
| **Proxy** | Nginx | YARP | Traefik | Caddy |
| **Hosting** | Hetzner VPS | DigitalOcean | Azure | AWS |
