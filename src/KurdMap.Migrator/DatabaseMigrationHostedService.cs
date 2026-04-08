using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KurdMap.Migrator;

/// <summary>
/// IHostedService that automatically runs migrations on application startup.
/// Supports retry with exponential backoff for containerized environments
/// where the database may not be immediately available.
/// </summary>
public sealed class DatabaseMigrationHostedService<TContext> : IHostedService
    where TContext : DbContext
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseMigrationHostedService<TContext>> _logger;
    private readonly MigrationOptions _options;

    public DatabaseMigrationHostedService(
        IServiceProvider serviceProvider,
        ILogger<DatabaseMigrationHostedService<TContext>> logger,
        MigrationOptions? options = null)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options ?? new MigrationOptions();
    }

    public async Task StartAsync(CancellationToken ct)
    {
        _logger.LogInformation("[Migrator] Starting automatic database migration...");

        MigrationResult? result = null;
        var attempt = 0;

        while (attempt < _options.MaxRetries)
        {
            attempt++;
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TContext>();
                var migrator = new DatabaseMigrator<TContext>(context, _logger);

                result = await migrator.MigrateAsync(ct);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "[Migrator] Migration completed on attempt {Attempt}/{Max} — {Applied} migration(s) applied in {Duration:N0}ms",
                        attempt, _options.MaxRetries, result.MigrationsApplied.Count, result.Duration.TotalMilliseconds);
                    return;
                }
            }
            catch (Exception ex) when (attempt < _options.MaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                _logger.LogWarning(ex,
                    "[Migrator] Attempt {Attempt}/{Max} failed — retrying in {Delay}s...",
                    attempt, _options.MaxRetries, delay.TotalSeconds);
                await Task.Delay(delay, ct);
            }
        }

        if (result is not { Success: true })
        {
            _logger.LogError("[Migrator] All {Max} attempt(s) exhausted. Last error: {Error}",
                _options.MaxRetries, result?.Error ?? "Unknown");

            if (_options.ThrowOnFailure)
                throw new InvalidOperationException(
                    $"Database migration failed after {_options.MaxRetries} attempts. Error: {result?.Error}");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
