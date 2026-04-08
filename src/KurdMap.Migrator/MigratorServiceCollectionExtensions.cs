using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KurdMap.Migrator;

/// <summary>
/// Extension methods to register automatic database migration in the DI container.
/// </summary>
public static class MigratorServiceCollectionExtensions
{
    /// <summary>
    /// Registers the DatabaseMigrationHostedService that automatically applies
    /// pending EF Core migrations on application startup with retry + backoff.
    /// Use this when no inline seed code runs before app.Run().
    /// </summary>
    public static IServiceCollection AddAutoMigration<TContext>(
        this IServiceCollection services,
        Action<MigrationOptions>? configure = null)
        where TContext : DbContext
    {
        var options = new MigrationOptions();
        configure?.Invoke(options);

        services.AddSingleton(options);
        services.AddHostedService<DatabaseMigrationHostedService<TContext>>();

        return services;
    }

    /// <summary>
    /// Runs pending EF Core migrations inline (blocking) before the application starts.
    /// Use this when you have seed code that must run after migration but before app.Run().
    /// </summary>
    public static async Task<MigrationResult> MigrateDatabaseAsync<TContext>(
        this IHost host,
        MigrationOptions? options = null,
        CancellationToken ct = default)
        where TContext : DbContext
    {
        options ??= new MigrationOptions();
        var logger = host.Services.GetRequiredService<ILogger<DatabaseMigrator<TContext>>>();

        MigrationResult? result = null;
        var attempt = 0;

        while (attempt < options.MaxRetries)
        {
            attempt++;
            try
            {
                using var scope = host.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TContext>();
                var migrator = new DatabaseMigrator<TContext>(context, logger);

                result = await migrator.MigrateAsync(ct);

                if (result.Success)
                {
                    logger.LogInformation(
                        "[Migrator] Migration completed on attempt {Attempt}/{Max} — {Applied} migration(s) applied in {Duration:N0}ms",
                        attempt, options.MaxRetries, result.MigrationsApplied.Count, result.Duration.TotalMilliseconds);
                    return result;
                }
            }
            catch (Exception ex) when (attempt < options.MaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                logger.LogWarning(ex,
                    "[Migrator] Attempt {Attempt}/{Max} failed — retrying in {Delay}s...",
                    attempt, options.MaxRetries, delay.TotalSeconds);
                await Task.Delay(delay, ct);
            }
        }

        if (result is not { Success: true } && options.ThrowOnFailure)
            throw new InvalidOperationException(
                $"Database migration failed after {options.MaxRetries} attempts. Error: {result?.Error}");

        return result ?? new MigrationResult { Error = "All attempts exhausted" };
    }
}
