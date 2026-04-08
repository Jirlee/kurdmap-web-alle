using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace KurdMap.Migrator;

/// <summary>
/// Professional database migrator that applies pending EF Core migrations,
/// verifies connectivity, and seeds initial data.
/// </summary>
public sealed class DatabaseMigrator<TContext> where TContext : DbContext
{
    private readonly TContext _context;
    private readonly ILogger _logger;

    public DatabaseMigrator(TContext context, ILogger logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Run full migration pipeline: connectivity check → pending migrations → apply → verify.
    /// </summary>
    public async Task<MigrationResult> MigrateAsync(CancellationToken ct = default)
    {
        var result = new MigrationResult();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Step 1: Verify connectivity
            _logger.LogInformation("[Migrator] Checking database connectivity...");
            if (!await _context.Database.CanConnectAsync(ct))
            {
                _logger.LogWarning("[Migrator] Cannot connect — attempting to create database...");
                await _context.Database.EnsureCreatedAsync(ct);
                result.DatabaseCreated = true;
                _logger.LogInformation("[Migrator] Database created successfully.");
            }
            else
            {
                _logger.LogInformation("[Migrator] Database connection verified.");
            }

            // Step 2: Check pending migrations
            var pending = (await _context.Database.GetPendingMigrationsAsync(ct)).ToList();
            var applied = (await _context.Database.GetAppliedMigrationsAsync(ct)).ToList();

            result.AppliedMigrationsBefore = applied.Count;
            result.PendingMigrations = pending.Count;

            _logger.LogInformation(
                "[Migrator] Migrations — applied: {Applied}, pending: {Pending}",
                applied.Count, pending.Count);

            if (pending.Count > 0)
            {
                foreach (var migration in pending)
                {
                    _logger.LogInformation("[Migrator]   → Will apply: {Migration}", migration);
                }

                // Step 3: Apply migrations
                _logger.LogInformation("[Migrator] Applying {Count} pending migration(s)...", pending.Count);
                await _context.Database.MigrateAsync(ct);

                var afterApplied = (await _context.Database.GetAppliedMigrationsAsync(ct)).ToList();
                result.AppliedMigrationsAfter = afterApplied.Count;
                result.MigrationsApplied = pending;

                _logger.LogInformation("[Migrator] All migrations applied successfully.");
            }
            else
            {
                result.AppliedMigrationsAfter = applied.Count;
                _logger.LogInformation("[Migrator] Database is up to date — no migrations to apply.");
            }

            // Step 4: Verify final state
            var finalPending = (await _context.Database.GetPendingMigrationsAsync(ct)).ToList();
            if (finalPending.Count > 0)
            {
                _logger.LogError("[Migrator] Verification failed — {Count} migration(s) still pending!", finalPending.Count);
                result.Success = false;
            }
            else
            {
                result.Success = true;
                _logger.LogInformation("[Migrator] Verification passed — all migrations applied.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Migrator] Migration failed with error: {Message}", ex.Message);
            result.Success = false;
            result.Error = ex.Message;
        }

        sw.Stop();
        result.Duration = sw.Elapsed;
        _logger.LogInformation("[Migrator] Completed in {Duration:N0}ms (success={Success})",
            sw.ElapsedMilliseconds, result.Success);

        return result;
    }
}
