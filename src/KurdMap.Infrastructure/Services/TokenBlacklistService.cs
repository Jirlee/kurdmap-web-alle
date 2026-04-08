using KurdMap.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace KurdMap.Infrastructure.Services;

/// <summary>
/// Redis-based JWT blacklist. Stores revoked JTI values with TTL matching token expiry.
/// </summary>
public sealed class TokenBlacklistService(IDistributedCache cache) : ITokenBlacklistService
{
    private const string Prefix = "blacklist:jti:";

    public async Task BlacklistAsync(string jti, TimeSpan remainingLifetime, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti)) return;

        // Store with TTL = remaining token lifetime (auto-cleanup after token expires)
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = remainingLifetime > TimeSpan.Zero
                ? remainingLifetime
                : TimeSpan.FromMinutes(1)
        };

        await cache.SetStringAsync($"{Prefix}{jti}", "revoked", options, ct);
    }

    public async Task<bool> IsBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti)) return false;

        var value = await cache.GetStringAsync($"{Prefix}{jti}", ct);
        return value is not null;
    }
}
