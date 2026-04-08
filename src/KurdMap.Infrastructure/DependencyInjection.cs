using System.Reflection;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Common;
using KurdMap.Domain.Users.Entities;
using KurdMap.Infrastructure.Identity;
using KurdMap.Infrastructure.Persistence;
using KurdMap.Infrastructure.Persistence.Interceptors;
using KurdMap.Infrastructure.Persistence.Repositories;
using KurdMap.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KurdMap.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Interceptors
        services.AddSingleton<AuditableEntityInterceptor>();
        services.AddScoped<DomainEventDispatcherInterceptor>();

        // EF Core + PostgreSQL
        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditableEntityInterceptor>();
            var eventInterceptor = sp.GetRequiredService<DomainEventDispatcherInterceptor>();
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
            options.AddInterceptors(auditInterceptor, eventInterceptor);
        });

        // ASP.NET Core Identity
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // JWT
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Repositories & UoW — auto-register by convention
        // Scans for classes ending in "Repository" and registers them against their matching interface.
        var infraAssembly = Assembly.GetExecutingAssembly();
        var repositoryTypes = infraAssembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false } && t.Name.EndsWith("Repository"));

        foreach (var implType in repositoryTypes)
        {
            var iface = implType.GetInterfaces()
                .FirstOrDefault(i => i.Name == $"I{implType.Name}");
            if (iface is not null)
                services.AddScoped(iface, implType);
        }

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<ISlugService, SlugService>();

        // Redis distributed cache
        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "KurdMap:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.AddScoped<ICacheService, RedisCacheService>();

        // Image service
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
