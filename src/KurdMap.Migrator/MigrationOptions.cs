namespace KurdMap.Migrator;

/// <summary>
/// Configuration options for the automatic migration service.
/// </summary>
public sealed class MigrationOptions
{
    /// <summary>
    /// Maximum retry attempts when the database is unreachable (e.g. container startup race).
    /// Default: 5 with exponential backoff (2s, 4s, 8s, 16s, 32s).
    /// </summary>
    public int MaxRetries { get; set; } = 5;

    /// <summary>
    /// If true, throws an exception when all retries are exhausted — prevents the app from starting
    /// with an outdated schema. Recommended for production.
    /// </summary>
    public bool ThrowOnFailure { get; set; } = true;
}
