namespace KurdMap.Application.Common.Interfaces;

/// <summary>
/// Redis-based JWT blacklist for immediate token revocation.
/// Tracks JTI (JWT ID) claims of revoked tokens until their natural expiry.
/// </summary>
public interface ITokenBlacklistService
{
    Task BlacklistAsync(string jti, TimeSpan remainingLifetime, CancellationToken ct = default);
    Task<bool> IsBlacklistedAsync(string jti, CancellationToken ct = default);
}
