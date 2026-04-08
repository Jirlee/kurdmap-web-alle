namespace KurdMap.Migrator;

/// <summary>
/// Result of a migration run.
/// </summary>
public sealed class MigrationResult
{
    public bool Success { get; set; }
    public bool DatabaseCreated { get; set; }
    public int AppliedMigrationsBefore { get; set; }
    public int AppliedMigrationsAfter { get; set; }
    public int PendingMigrations { get; set; }
    public List<string> MigrationsApplied { get; set; } = [];
    public TimeSpan Duration { get; set; }
    public string? Error { get; set; }
}
