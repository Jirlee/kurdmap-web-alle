namespace KurdMap.Application.Common.Interfaces;

/// <summary>
/// Provides contextual information about the current HTTP request.
/// Populated automatically by middleware and available for injection into handlers.
/// </summary>
public interface IRequestContext
{
    Guid? UserId { get; }
    string? Email { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
    string? CorrelationId { get; }
    string? IpAddress { get; }
    DateTime RequestTimestamp { get; }
}
