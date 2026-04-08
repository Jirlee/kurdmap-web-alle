namespace KurdMap.Domain.Users.Entities;

/// <summary>
/// Stored refresh token with rotation tracking and family-based replay detection.
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Token { get; private set; } = null!;
    public Guid UserId { get; private set; }
    public string? ReplacedByToken { get; private set; }
    public string Family { get; private set; } = null!;
    public string CreatedByIp { get; private set; } = null!;
    public string? RevokedByIp { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive => !IsRevoked && !IsExpired;

    // Navigation
    public ApplicationUser User { get; private set; } = null!;

    private RefreshToken() { }

    public static RefreshToken Create(string token, Guid userId, string family, string ipAddress, int expirationDays)
    {
        return new RefreshToken
        {
            Token = token,
            UserId = userId,
            Family = family,
            CreatedByIp = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays)
        };
    }

    public void Revoke(string ipAddress, string? replacedByToken = null)
    {
        RevokedAt = DateTime.UtcNow;
        RevokedByIp = ipAddress;
        ReplacedByToken = replacedByToken;
    }
}
