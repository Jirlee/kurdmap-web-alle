using KurdMap.Infrastructure.Persistence;
using KurdMap.Migrator;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace KurdMap.Tests.Integration;

public class KurdMapWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "KurdMapTestDb_" + Guid.NewGuid().ToString("N");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove ALL EF Core DbContext-related registrations (Npgsql + interceptors)
            var descriptorsToRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true ||
                d.ImplementationType?.FullName?.Contains("Npgsql") == true ||
                d.ServiceType.FullName?.Contains("Npgsql") == true
            ).ToList();

            foreach (var d in descriptorsToRemove)
                services.Remove(d);

            // Add InMemory database (single provider, shared name across scopes)
            var dbName = _dbName;
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName);
            });

            // Replace Redis with memory cache
            var redisDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(Microsoft.Extensions.Caching.Distributed.IDistributedCache));
            if (redisDescriptor is not null)
                services.Remove(redisDescriptor);

            services.AddDistributedMemoryCache();

            // Replace health check registrations that depend on PostgreSQL/Redis
            var healthDescriptors = services.Where(d =>
                d.ServiceType.FullName?.Contains("HealthCheck") == true &&
                (d.ImplementationType?.FullName?.Contains("Npgsql") == true ||
                 d.ImplementationType?.FullName?.Contains("Redis") == true)
            ).ToList();

            foreach (var d in healthDescriptors)
                services.Remove(d);
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Ensure InMemory DB schema is ready
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        return host;
    }
}
