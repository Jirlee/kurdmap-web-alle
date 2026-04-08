# ASP.NET Core 10 API Security

> **Ziel:** Government/Banking-Grade API-Sicherheit  
> **Framework:** ASP.NET Core 10 Minimal APIs + Controller-based APIs  
> **Fokus:** Vollständige OWASP-Abdeckung, Defense in Depth, Zero Trust API

---

## Inhaltsverzeichnis

- [1. Secure API Architecture](#1-secure-api-architecture)
- [2. Middleware Security Pipeline](#2-middleware-security-pipeline)
- [3. Authentication & Authorization](#3-authentication--authorization)
- [4. Input Validation & Anti-Injection](#4-input-validation--anti-injection)
- [5. CORS Configuration](#5-cors-configuration)
- [6. Rate Limiting](#6-rate-limiting)
- [7. Anti-Tampering & Request Security](#7-anti-tampering--request-security)
- [8. Error Handling & Information Disclosure](#8-error-handling--information-disclosure)
- [9. API Versioning & Documentation Security](#9-api-versioning--documentation-security)
- [10. Database Security](#10-database-security)
- [11. File Upload Security](#11-file-upload-security)
- [12. Logging & Audit Trail](#12-logging--audit-trail)
- [13. Security Middleware Implementations](#13-security-middleware-implementations)

---

## 1. Secure API Architecture

### 1.1 Sichere API-Schichten

```
Request Flow:
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Caddy    │ → │ Security │ → │ Business │ → │ Data     │ → │ Database │
│ Reverse  │   │ Middleware│   │ Logic    │   │ Access   │   │          │
│ Proxy    │   │ Pipeline │   │ Layer    │   │ Layer    │   │          │
└─────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                    │
         ┌──────────┼──────────────────────────┐
         │          │                           │
    ┌────▼────┐ ┌───▼─────┐ ┌──────────┐ ┌────▼─────┐
    │Request  │ │Auth &   │ │Input     │ │Audit     │
    │Size     │ │AuthZ    │ │Validation│ │Logging   │
    │Limit    │ │         │ │          │ │          │
    └─────────┘ └─────────┘ └──────────┘ └──────────┘
```

### 1.2 Project Setup

```csharp
// Program.cs — Sichere Basis-Konfiguration
var builder = WebApplication.CreateBuilder(args);

// ============================================================
// SECURITY SERVICES
// ============================================================

// HTTPS erzwingen
builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
    options.HttpsPort = 443;
});

// HSTS
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(730); // 2 Jahre
});

// Anti-Forgery
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "__Host-XSRF";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Kestrel Security
builder.WebHost.ConfigureKestrel(options =>
{
    // Request Size Limits
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
    options.Limits.MaxRequestHeadersTotalSize = 32 * 1024; // 32 KB
    options.Limits.MaxRequestHeaderCount = 50;
    options.Limits.MaxRequestLineSize = 8 * 1024; // 8 KB
    
    // Connection Limits
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxConcurrentUpgradedConnections = 100;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    
    // HTTP/2 Settings
    options.Limits.Http2.MaxStreamsPerConnection = 100;
    options.Limits.Http2.MaxFrameSize = 16 * 1024;
    options.Limits.Http2.InitialConnectionWindowSize = 128 * 1024;
    
    // Server Header entfernen
    options.AddServerHeader = false;
});

var app = builder.Build();
```

---

## 2. Middleware Security Pipeline

### 2.1 Korrekte Middleware-Reihenfolge

```csharp
// ============================================================
// MIDDLEWARE PIPELINE — Reihenfolge ist KRITISCH!
// ============================================================

// 1. Exception Handler (MUSS zuerst kommen)
app.UseExceptionHandler("/error");

// 2. HSTS (nur in Production)
if (app.Environment.IsProduction())
{
    app.UseHsts();
}

// 3. HTTPS Redirect
app.UseHttpsRedirection();

// 4. Forwarded Headers (für Caddy Proxy)
app.UseForwardedHeaders();

// 5. Request Size Limiting
app.UseMiddleware<RequestSizeLimitMiddleware>();

// 6. Correlation ID / Request Tracking
app.UseMiddleware<CorrelationIdMiddleware>();

// 7. Security Headers
app.UseMiddleware<SecurityHeadersMiddleware>();

// 8. IP Rate Limiting
app.UseRateLimiter();

// 9. CORS
app.UseCors();

// 10. Authentication
app.UseAuthentication();

// 11. Authorization
app.UseAuthorization();

// 12. Anti-Forgery
app.UseAntiforgery();

// 13. Audit Logging
app.UseMiddleware<AuditLoggingMiddleware>();

// 14. Response Caching/Compression
app.UseResponseCompression();

// 15. Endpoints
app.MapControllers();
```

---

## 3. Authentication & Authorization

### 3.1 JWT-basierte Authentication

```csharp
// JWT Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Issuer & Audience validieren
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            
            // Signatur validieren (ASYMMETRISCH!)
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new RsaSecurityKey(rsaKey), // RSA 4096-bit
            
            // Token-Lebensdauer validieren
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30), // Minimal Skew
            
            // Algorithmus erzwingen (verhindert Algorithm Confusion Attack)
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha512 },
            
            // Token-Typ validieren
            ValidTypes = new[] { "at+jwt" },
        };
        
        // Events für Logging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Authentication failed: {Error}", 
                    context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                // Token Blacklist prüfen
                var tokenId = context.Principal?.FindFirst("jti")?.Value;
                var blacklist = context.HttpContext.RequestServices
                    .GetRequiredService<ITokenBlacklistService>();
                if (blacklist.IsRevoked(tokenId))
                {
                    context.Fail("Token has been revoked");
                }
                return Task.CompletedTask;
            }
        };
    });
```

### 3.2 Policy-Based Authorization (RBAC + ABAC)

```csharp
// Authorization Policies
builder.Services.AddAuthorizationBuilder()
    // Rolle-basiert
    .AddPolicy("Admin", policy => policy
        .RequireRole("Admin")
        .RequireClaim("department", "IT"))
    
    // Multi-Factor erforderlich
    .AddPolicy("MfaRequired", policy => policy
        .RequireClaim("amr", "mfa"))
    
    // Banking-Operationen
    .AddPolicy("BankingTransaction", policy => policy
        .RequireRole("BankingOperator")
        .RequireClaim("amr", "mfa")
        .RequireClaim("clearance", "financial")
        .AddRequirements(new MaxTransactionAmountRequirement(1_000_000)))
    
    // API Key für Service-to-Service
    .AddPolicy("ServiceApiKey", policy => policy
        .AddAuthenticationSchemes("ApiKey")
        .RequireAuthenticatedUser())
    
    // Resource Owner
    .AddPolicy("ResourceOwner", policy => policy
        .AddRequirements(new ResourceOwnerRequirement()));

// Custom Authorization Handler
public class ResourceOwnerHandler 
    : AuthorizationHandler<ResourceOwnerRequirement, IOwnable>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ResourceOwnerRequirement requirement,
        IOwnable resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (resource.OwnerId.ToString() == userId || 
            context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}
```

### 3.3 Sichere Controller-Beispiele

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Authorize] // Default: Authentifizierung erforderlich
[Produces("application/json")]
public class AccountsController : ControllerBase
{
    // Nur eigene Daten abrufen (Resource Owner Check)
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ResourceOwner")]
    [ProducesResponseType(typeof(AccountDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAccount(Guid id)
    {
        var account = await _accountService.GetByIdAsync(id);
        if (account is null)
            return NotFound();
        
        // Authorization Check
        var authResult = await _authorizationService.AuthorizeAsync(
            User, account, "ResourceOwner");
        if (!authResult.Succeeded)
            return Forbid();
        
        return Ok(_mapper.Map<AccountDto>(account));
    }
    
    // Banking-Transaction mit erhöhter Sicherheit
    [HttpPost("transfer")]
    [Authorize(Policy = "BankingTransaction")]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(typeof(TransferResultDto), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Transfer(
        [FromBody] TransferRequestDto request)
    {
        // Idempotency Key prüfen
        if (!Request.Headers.TryGetValue("Idempotency-Key", out var idempotencyKey))
            return BadRequest("Idempotency-Key header required");
        
        var result = await _transferService.ExecuteAsync(request, idempotencyKey);
        return Ok(result);
    }
    
    // Admin-Only Endpunkt
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    [Authorize(Policy = "MfaRequired")]
    public async Task<IActionResult> GetAllAccounts(
        [FromQuery] PaginationDto pagination)
    {
        var accounts = await _accountService.GetPagedAsync(pagination);
        return Ok(accounts);
    }
}
```

---

## 4. Input Validation & Anti-Injection

### 4.1 FluentValidation

```csharp
// DTOs (Data Transfer Objects) — NIEMALS Entity-Modelle direkt exponieren!
public record CreateUserDto
{
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Password { get; init; }
}

// FluentValidation Validator
public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(256)
            .EmailAddress()
            .Must(BeValidEmailDomain)
            .WithMessage("Invalid email domain");
        
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(100)
            .Matches(@"^[\p{L}\s\-']+$")
            .WithMessage("Name contains invalid characters");
        
        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(100)
            .Matches(@"^[\p{L}\s\-']+$")
            .WithMessage("Name contains invalid characters");
        
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(14)
            .MaximumLength(128)
            .Matches(@"[A-Z]").WithMessage("Must contain uppercase")
            .Matches(@"[a-z]").WithMessage("Must contain lowercase")
            .Matches(@"[0-9]").WithMessage("Must contain digit")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Must contain special character")
            .Must(NotContainCommonPasswords)
            .WithMessage("Password is too common");
    }
    
    private bool BeValidEmailDomain(string email)
    {
        // Disposable Email Provider blockieren
        var blockedDomains = new[] { "tempmail.com", "throwaway.email" };
        var domain = email.Split('@').LastOrDefault()?.ToLowerInvariant();
        return domain != null && !blockedDomains.Contains(domain);
    }
    
    private bool NotContainCommonPasswords(string password)
    {
        var common = new[] { "password", "123456", "qwerty", "letmein" };
        return !common.Any(c => password.Contains(c, StringComparison.OrdinalIgnoreCase));
    }
}

// FluentValidation registrieren
builder.Services.AddValidatorsFromAssemblyContaining<CreateUserDtoValidator>();

// Automatische Validation via Filter
builder.Services.AddFluentValidationAutoValidation();
```

### 4.2 SQL Injection Prevention

```csharp
// RICHTIG: Entity Framework Core mit Parameterized Queries
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    
    // ✅ SICHER — EF Core parameterisiert automatisch
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);
    }
    
    // ✅ SICHER — Parameterized Raw SQL
    public async Task<IReadOnlyList<User>> SearchAsync(string searchTerm)
    {
        return await _context.Users
            .FromSqlInterpolated(
                $"SELECT * FROM Users WHERE Name LIKE {'%' + searchTerm + '%'}")
            .ToListAsync();
    }
    
    // ❌ NIEMALS — String Concatenation in SQL
    // public async Task<User?> UNSICHER_GetByEmail(string email)
    // {
    //     return await _context.Users
    //         .FromSqlRaw($"SELECT * FROM Users WHERE Email = '{email}'")
    //         .FirstOrDefaultAsync();
    // }
}
```

### 4.3 Mass Assignment Prevention

```csharp
// ❌ UNSICHER — Entity direkt binden
// [HttpPost]
// public async Task<IActionResult> Create([FromBody] User user) { ... }

// ✅ SICHER — DTO mit expliziten Properties
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
{
    // Manuelles Mapping oder AutoMapper
    var user = new User
    {
        Email = dto.Email,
        FirstName = dto.FirstName,
        LastName = dto.LastName,
        // Role wird NICHT aus dem Request übernommen!
        Role = UserRole.User, // Default-Rolle
        CreatedAt = DateTimeOffset.UtcNow
    };
    
    await _userService.CreateAsync(user, dto.Password);
    return CreatedAtAction(nameof(GetById), new { id = user.Id }, 
        _mapper.Map<UserDto>(user));
}
```

### 4.4 SSRF Prevention

```csharp
// Server-Side Request Forgery verhindern
public class SafeHttpClient
{
    private static readonly HashSet<string> BlockedSchemes = 
        new() { "file", "ftp", "gopher", "dict", "ldap" };
    
    private static readonly IPAddress[] BlockedRanges =
    {
        IPAddress.Parse("127.0.0.1"),
        IPAddress.Parse("10.0.0.0"),
        IPAddress.Parse("172.16.0.0"),
        IPAddress.Parse("192.168.0.0"),
        IPAddress.Parse("169.254.0.0"),
    };
    
    public async Task<HttpResponseMessage> SafeGetAsync(string url)
    {
        var uri = new Uri(url);
        
        // Scheme prüfen
        if (BlockedSchemes.Contains(uri.Scheme.ToLower()))
            throw new SecurityException("Blocked URL scheme");
        
        // Nur HTTPS erlauben
        if (uri.Scheme != "https")
            throw new SecurityException("Only HTTPS allowed");
        
        // IP-Adresse auflösen und gegen interne Ranges prüfen
        var addresses = await Dns.GetHostAddressesAsync(uri.Host);
        foreach (var addr in addresses)
        {
            if (IsPrivateIp(addr))
                throw new SecurityException("Access to internal networks blocked");
        }
        
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        return await client.GetAsync(uri);
    }
    
    private bool IsPrivateIp(IPAddress ip)
    {
        var bytes = ip.GetAddressBytes();
        return bytes[0] == 10 ||
               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168) ||
               (bytes[0] == 127) ||
               (bytes[0] == 169 && bytes[1] == 254);
    }
}
```

---

## 5. CORS Configuration

```csharp
// Strikte CORS-Konfiguration
builder.Services.AddCors(options =>
{
    // Hauptanwendung
    options.AddPolicy("AppPolicy", policy =>
    {
        policy
            .WithOrigins(
                "https://app.example.com",
                "https://admin.example.com")
            .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .WithHeaders(
                "Authorization",
                "Content-Type",
                "X-Request-ID",
                "X-XSRF-TOKEN")
            .WithExposedHeaders(
                "X-Request-ID",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset")
            .AllowCredentials()
            .SetPreflightMaxAge(TimeSpan.FromHours(24));
    });
    
    // Keine CORS für interne Services
    options.AddPolicy("Internal", policy =>
    {
        policy.WithOrigins("http://localhost:5000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// CORS anwenden
app.UseCors("AppPolicy");
```

---

## 6. Rate Limiting

```csharp
// Built-in Rate Limiting (ASP.NET Core 10)
builder.Services.AddRateLimiter(options =>
{
    // Globales Limit
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext =>
        {
            var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return RateLimitPartition.GetFixedWindowLimiter(remoteIp,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 100,
                    Window = TimeSpan.FromSeconds(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 10
                });
        });
    
    // Login — Sehr strikt
    options.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0; // Kein Queuing
    });
    
    // API Endpoints
    options.AddSlidingWindowLimiter("api", opt =>
    {
        opt.PermitLimit = 30;
        opt.Window = TimeSpan.FromSeconds(1);
        opt.SegmentsPerWindow = 4;
        opt.QueueLimit = 5;
    });
    
    // Token-basiertes Rate Limiting (pro User)
    options.AddTokenBucketLimiter("user-api", opt =>
    {
        opt.TokenLimit = 100;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(1);
        opt.TokensPerPeriod = 10;
        opt.QueueLimit = 5;
    });
    
    // Response bei Rate Limit
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = "60";
        
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Rate limit exceeded",
            retryAfter = 60
        }, cancellationToken);
    };
});

// Anwendung auf Endpoints
app.MapPost("/api/auth/login", LoginHandler)
    .RequireRateLimiting("login");

app.MapGet("/api/data", DataHandler)
    .RequireRateLimiting("api");
```

---

## 7. Anti-Tampering & Request Security

### 7.1 Anti-Forgery Token

```csharp
// CSRF Protection für State-Changing Operations
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
{
    // Anti-Forgery Token wird automatisch validiert
    return Ok(await _service.TransferAsync(dto));
}

// Token-Endpoint für SPA
app.MapGet("/api/antiforgery/token", (IAntiforgery antiforgery, HttpContext context) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new { token = tokens.RequestToken });
}).RequireAuthorization();
```

### 7.2 Request Integrity

```csharp
// Idempotency für kritische Operationen
public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IDistributedCache _cache;
    
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method is "POST" or "PUT" or "PATCH")
        {
            if (context.Request.Headers.TryGetValue("Idempotency-Key", out var key))
            {
                var cacheKey = $"idempotency:{key}";
                var cached = await _cache.GetStringAsync(cacheKey);
                
                if (cached != null)
                {
                    // Bereits verarbeitet — gespeicherte Antwort zurückgeben
                    context.Response.StatusCode = 200;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(cached);
                    return;
                }
                
                // Request verarbeiten und Ergebnis cachen
                var originalBody = context.Response.Body;
                using var memStream = new MemoryStream();
                context.Response.Body = memStream;
                
                await _next(context);
                
                memStream.Seek(0, SeekOrigin.Begin);
                var responseBody = await new StreamReader(memStream).ReadToEndAsync();
                
                if (context.Response.StatusCode is >= 200 and < 300)
                {
                    await _cache.SetStringAsync(cacheKey, responseBody,
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                        });
                }
                
                memStream.Seek(0, SeekOrigin.Begin);
                await memStream.CopyToAsync(originalBody);
                return;
            }
        }
        
        await _next(context);
    }
}
```

---

## 8. Error Handling & Information Disclosure

```csharp
// Globaler Exception Handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        
        var exceptionFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        var correlationId = context.Items["CorrelationId"]?.ToString();
        
        // NIEMALS Exception Details in Production exponieren!
        var response = new
        {
            error = "An internal error occurred",
            correlationId = correlationId,
            // KEINE stack traces, exception messages, etc.
        };
        
        // Intern loggen (mit allen Details)
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exceptionFeature?.Error,
            "Unhandled exception. CorrelationId: {CorrelationId}, Path: {Path}",
            correlationId, exceptionFeature?.Path);
        
        await context.Response.WriteAsJsonAsync(response);
    });
});

// Keine Developer Exception Page in Production!
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
// In Production wird der obige ExceptionHandler verwendet

// ProblemDetails für strukturierte Fehler
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        // Stack Trace entfernen in Production
        if (!ctx.HttpContext.RequestServices
                .GetRequiredService<IHostEnvironment>().IsDevelopment())
        {
            ctx.ProblemDetails.Extensions.Remove("exception");
        }
        
        ctx.ProblemDetails.Extensions["correlationId"] = 
            ctx.HttpContext.Items["CorrelationId"];
    };
});
```

---

## 9. API Versioning & Documentation Security

```csharp
// API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

// OpenAPI/Swagger — NUR in Development!
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}

// In Production: Swagger komplett deaktiviert
// KEIN app.MapOpenApi() in Production!
// KEIN app.UseSwaggerUI() in Production!
```

---

## 10. Database Security

```csharp
// Sichere Datenbank-Konfiguration
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
        
        // Command Timeout
        npgsqlOptions.CommandTimeout(30);
        
        // Migration Assembly
        npgsqlOptions.MigrationsAssembly("MyApp.Infrastructure");
    });
    
    // Query Tracking deaktivieren (Performance + Sicherheit)
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    
    // Sensitive Logging NUR in Development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Connection String NIEMALS im Code!
// Aus Secrets Manager (Azure Key Vault, AWS Secrets Manager, etc.)
// Oder aus Podman Secrets: /run/secrets/db-connection-string
```

### 10.1 Row-Level Security

```csharp
// Global Query Filter für Multi-Tenant Isolation
public class AppDbContext : DbContext
{
    private readonly Guid _currentTenantId;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Automatischer Tenant-Filter auf alle Queries
        modelBuilder.Entity<Account>()
            .HasQueryFilter(a => a.TenantId == _currentTenantId);
        
        modelBuilder.Entity<Transaction>()
            .HasQueryFilter(t => t.TenantId == _currentTenantId);
        
        // Soft Delete Filter
        modelBuilder.Entity<Account>()
            .HasQueryFilter(a => !a.IsDeleted);
    }
}
```

---

## 11. File Upload Security

```csharp
[HttpPost("upload")]
[Authorize]
[RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
public async Task<IActionResult> Upload(IFormFile file)
{
    // 1. Dateigröße prüfen
    if (file.Length == 0 || file.Length > 50 * 1024 * 1024)
        return BadRequest("Invalid file size");
    
    // 2. Content-Type Whitelist
    var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
    if (!allowedTypes.Contains(file.ContentType))
        return BadRequest("File type not allowed");
    
    // 3. Extension Whitelist
    var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension))
        return BadRequest("File extension not allowed");
    
    // 4. Magic Bytes prüfen (Content != Extension Spoofing)
    using var stream = file.OpenReadStream();
    var header = new byte[8];
    await stream.ReadExactlyAsync(header);
    stream.Seek(0, SeekOrigin.Begin);
    
    if (!IsValidFileSignature(header, extension))
        return BadRequest("File content does not match extension");
    
    // 5. Dateiname sanitieren
    var safeFileName = $"{Guid.NewGuid()}{extension}";
    
    // 6. Außerhalb des Web-Roots speichern
    var uploadPath = Path.Combine(_storageConfig.UploadPath, safeFileName);
    
    // 7. Path Traversal verhindern
    var fullPath = Path.GetFullPath(uploadPath);
    if (!fullPath.StartsWith(_storageConfig.UploadPath))
        return BadRequest("Invalid path");
    
    // 8. Virus-Scan (wenn ClamAV verfügbar)
    // await _virusScanner.ScanAsync(stream);
    
    // 9. Speichern
    using var fileStream = new FileStream(fullPath, FileMode.Create);
    await stream.CopyToAsync(fileStream);
    
    return Ok(new { fileName = safeFileName });
}

private bool IsValidFileSignature(byte[] header, string extension)
{
    var signatures = new Dictionary<string, byte[][]>
    {
        { ".pdf", new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
        { ".jpg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47 } } },
    };
    
    if (!signatures.TryGetValue(extension, out var sigs))
        return false;
    
    return sigs.Any(sig => header.Take(sig.Length).SequenceEqual(sig));
}
```

---

## 12. Logging & Audit Trail

```csharp
// Audit Logging Middleware
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTimeOffset.UtcNow;
        
        await _next(context);
        
        var duration = DateTimeOffset.UtcNow - startTime;
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var correlationId = context.Items["CorrelationId"]?.ToString();
        
        // Strukturiertes Audit-Log
        _logger.LogInformation(
            "API_AUDIT | {CorrelationId} | {Method} {Path} | " +
            "Status: {StatusCode} | User: {UserId} | IP: {RemoteIp} | " +
            "Duration: {Duration}ms | UserAgent: {UserAgent}",
            correlationId,
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            userId ?? "anonymous",
            context.Connection.RemoteIpAddress,
            duration.TotalMilliseconds,
            context.Request.Headers.UserAgent.ToString());
        
        // Sensitive Operationen separat loggen
        if (context.Request.Path.StartsWithSegments("/api/admin") || 
            context.Request.Path.StartsWithSegments("/api/transfer"))
        {
            _logger.LogWarning(
                "SENSITIVE_OPERATION | {CorrelationId} | {Method} {Path} | User: {UserId}",
                correlationId, context.Request.Method, context.Request.Path, userId);
        }
    }
}

// Serilog Konfiguration für strukturiertes Logging
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("System", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .WriteTo.Console(new JsonFormatter())
        .WriteTo.File(
            new JsonFormatter(),
            "/var/log/app/api.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 90);
});
```

---

## 13. Security Middleware Implementations

### 13.1 Security Headers Middleware

```csharp
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        
        // Server-Informationen entfernen
        headers.Remove("Server");
        headers.Remove("X-Powered-By");
        
        // Security Headers setzen
        headers.Append("X-Content-Type-Options", "nosniff");
        headers.Append("X-Frame-Options", "DENY");
        headers.Append("X-XSS-Protection", "0");
        headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.Append("Permissions-Policy", 
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), " +
            "magnetometer=(), microphone=(), payment=(), usb=()");
        headers.Append("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
        headers.Append("Cache-Control", "no-store");
        headers.Append("Pragma", "no-cache");
        
        await _next(context);
    }
}
```

### 13.2 Correlation ID Middleware

```csharp
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string CorrelationIdHeader = "X-Request-ID";
    
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");
        
        // Validieren (nur alphanumerisch, max 64 Zeichen)
        if (correlationId.Length > 64 || !correlationId.All(c => char.IsLetterOrDigit(c) || c == '-'))
        {
            correlationId = Guid.NewGuid().ToString("N");
        }
        
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[CorrelationIdHeader] = correlationId;
        
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [07 — Angular & Admin Panel](07-angular-admin-panel-security.md) | Frontend-Sicherheit |
| [08 — Authentication & Identity](08-authentication-identity.md) | Auth im Detail |
| [09 — Cryptography](09-cryptography-data-protection.md) | JWT-Signierung, Encryption |
