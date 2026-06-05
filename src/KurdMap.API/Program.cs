using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using KurdMap.API.Middleware;
using KurdMap.API.Services;
using KurdMap.Application;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Users.Entities;
using KurdMap.Infrastructure;
using KurdMap.Infrastructure.Identity;
using KurdMap.Infrastructure.Persistence;
using KurdMap.Infrastructure.Services;
using KurdMap.Migrator;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// ══════════════════════════════════════════════════════════════════════════
// STARTUP VALIDATION — fail fast if critical configuration is missing
// ══════════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()!;

if (!builder.Environment.IsEnvironment("Testing"))
{
    if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32)
        throw new InvalidOperationException("JWT Secret must be at least 32 characters. Set via Jwt:Secret.");

    if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
        throw new InvalidOperationException("Database connection string is missing. Set ConnectionStrings:DefaultConnection.");
}

// ══════════════════════════════════════════════════════════════════════════
// SERILOG — structured logging with security context enrichment
// ══════════════════════════════════════════════════════════════════════════
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.WithProperty("Application", "KurdMap.API")
    .Enrich.WithProperty("Environment", ctx.HostingEnvironment.EnvironmentName));

// ══════════════════════════════════════════════════════════════════════════
// LAYERS (Clean Architecture DI)
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ══════════════════════════════════════════════════════════════════════════
// SECURITY SERVICES
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IRequestContext, RequestContext>();
builder.Services.AddScoped<ISecurityLogger, SecurityLogger>();
builder.Services.AddScoped<ITokenBlacklistService, TokenBlacklistService>();

// Migration options
builder.Services.AddSingleton(new KurdMap.Migrator.MigrationOptions
{
    MaxRetries = 5,
    ThrowOnFailure = !builder.Environment.IsDevelopment()
});

// ══════════════════════════════════════════════════════════════════════════
// JWT AUTHENTICATION — hardened with JTI blacklist validation
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ClockSkew = TimeSpan.Zero, // No tolerance — exact expiry enforcement
        RequireExpirationTime = true,
        RequireSignedTokens = true,
        // Enforce specific algorithm — prevent algorithm confusion attacks
        ValidAlgorithms = [SecurityAlgorithms.HmacSha512]
    };

    // ── JWT Events: Blacklist check + security logging ────────────────
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            // Check if token's JTI is blacklisted (revoked)
            var jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
            if (!string.IsNullOrEmpty(jti))
            {
                var blacklist = context.HttpContext.RequestServices.GetRequiredService<ITokenBlacklistService>();
                if (await blacklist.IsBlacklistedAsync(jti))
                {
                    context.Fail("Token has been revoked.");
                    var secLogger = context.HttpContext.RequestServices.GetService<ISecurityLogger>();
                    secLogger?.LogSuspiciousActivity(
                        context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier),
                        "revoked_token_usage",
                        $"JTI={jti}",
                        context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
                }
            }
        },
        OnAuthenticationFailed = context =>
        {
            var secLogger = context.HttpContext.RequestServices.GetService<ISecurityLogger>();
            var ip = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (context.Exception is SecurityTokenExpiredException)
            {
                context.Response.Headers["X-Token-Expired"] = "true";
            }
            else
            {
                secLogger?.LogSuspiciousActivity(null, "jwt_authentication_failed",
                    context.Exception.GetType().Name, ip);
            }
            return Task.CompletedTask;
        },
        OnForbidden = context =>
        {
            var secLogger = context.HttpContext.RequestServices.GetService<ISecurityLogger>();
            var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var ip = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            secLogger?.LogAccessDenied(userId,
                context.HttpContext.Request.Path,
                context.HttpContext.Request.Method, ip);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ══════════════════════════════════════════════════════════════════════════
// IDENTITY — hardened with lockout and strict password rules
// ══════════════════════════════════════════════════════════════════════════
builder.Services.Configure<IdentityOptions>(options =>
{
    // Lockout: 6 failed attempts → 15 minute lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 6;
    options.Lockout.AllowedForNewUsers = true;
});

// Antiforgery — XSRF protection
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.HttpOnly = false; // Angular reads from cookie
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI (only in Development)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new() { Title = "KurdMap API", Version = "v1" });
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "Enter JWT Bearer token",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT"
        });
        options.AddSecurityRequirement(doc =>
        {
            var scheme = new OpenApiSecuritySchemeReference("Bearer", doc);
            var requirement = new OpenApiSecurityRequirement();
            requirement.Add(scheme, new List<string>());
            return requirement;
        });
    });
}

// ══════════════════════════════════════════════════════════════════════════
// CORS — explicit origins only, no wildcards
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
              .AllowCredentials()
              .WithExposedHeaders("X-Correlation-Id", "X-Token-Expired");
    });
});

// Health checks — DB + Redis
var healthChecks = builder.Services.AddHealthChecks();
var pgConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(pgConn))
    healthChecks.AddNpgSql(pgConn, name: "postgresql");
var redisConn = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConn))
    healthChecks.AddRedis(redisConn, name: "redis");

// ══════════════════════════════════════════════════════════════════════════
// RATE LIMITING — multi-tier with sliding window + global limiter
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global per-IP/per-user sliding window: 200 req/min
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var clientId = context.User.Identity?.IsAuthenticated == true
            ? context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "auth"
            : context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetSlidingWindowLimiter(clientId, _ =>
            new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueLimit = 0
            });
    });

    // General API: 100 req/min per IP
    options.AddPolicy("fixed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Auth endpoints: 5 req/min per IP (very strict), relaxed in Testing
    var authPermitLimit = builder.Environment.IsEnvironment("Testing") ? 1000 : 5;
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = authPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 2,
                QueueLimit = 0
            }));

    // Upload endpoints: 10 req/min per IP
    options.AddPolicy("upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Admin-only endpoints: 30 req/min per user
    options.AddPolicy("admin", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

// ══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE PIPELINE (order matters — security layers first)
// ══════════════════════════════════════════════════════════════════════════

// Layer 1: Security headers on every response
app.UseMiddleware<SecurityHeadersMiddleware>();

// Layer 2: Request size enforcement (DoS protection)
app.UseMiddleware<RequestSizeLimitMiddleware>();

// Layer 3: Global exception handling (never leak stack traces)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Layer 4: Correlation ID for request tracing
app.UseMiddleware<CorrelationIdMiddleware>();

// Layer 5: Brute force protection on auth endpoints
app.UseMiddleware<BruteForceProtectionMiddleware>();

// Layer 6: Structured request logging with security context
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("UserId",
            httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous");
        diagnosticContext.Set("ClientIP",
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        diagnosticContext.Set("UserAgent",
            httpContext.Request.Headers.UserAgent.ToString().Length > 200
                ? httpContext.Request.Headers.UserAgent.ToString()[..200]
                : httpContext.Request.Headers.UserAgent.ToString());
    };

    // Filter noise from health checks
    options.GetLevel = (ctx, elapsed, ex) =>
        ctx.Request.Path.StartsWithSegments("/health") ? LogEventLevel.Verbose
        : ex is not null ? LogEventLevel.Error
        : elapsed > 5000 ? LogEventLevel.Warning
        : LogEventLevel.Information;
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous();

// Run migrations before seeding (skip for InMemory/Testing)
if (!app.Environment.IsEnvironment("Testing"))
{
    await app.MigrateDatabaseAsync<AppDbContext>();
}

// Seed roles and default admin on startup
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    foreach (var role in KurdMap.Shared.AppRoles.All)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
    }

    // Seed default admin if no users exist
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    if (!userManager.Users.Any())
    {
        var adminEmail = app.Configuration["SEED_ADMIN_EMAIL"] ?? "admin@kurdmap.de";
        var adminPassword = app.Configuration["SEED_ADMIN_PASSWORD"] ?? "Admin123!@#";
        var adminFullName = app.Configuration["SEED_ADMIN_FULLNAME"] ?? "Aram Hossaini";

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = adminFullName,
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(admin, adminPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRolesAsync(admin, [KurdMap.Shared.AppRoles.SuperAdmin, KurdMap.Shared.AppRoles.Admin]);
            Log.Information("Default admin user seeded: {Email}", admin.Email);
        }
        else
        {
            Log.Error("Failed to seed default admin user: {Errors}",
                string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }
}

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program;
