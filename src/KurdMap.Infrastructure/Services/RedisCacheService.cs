using System.Text.Json;
using KurdMap.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace KurdMap.Infrastructure.Services;

public sealed class RedisCacheService(IDistributedCache cache) : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        var data = await cache.GetStringAsync(key, ct);
        return data is null ? null : JsonSerializer.Deserialize<T>(data, JsonOptions);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default) where T : class
    {
        var options = new DistributedCacheEntryOptions();
        if (expiration.HasValue)
            options.AbsoluteExpirationRelativeToNow = expiration;

        var data = JsonSerializer.Serialize(value, JsonOptions);
        await cache.SetStringAsync(key, data, options, ct);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
        => await cache.RemoveAsync(key, ct);

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        // IDistributedCache does not support prefix removal natively.
        // For Redis, use StackExchange.Redis IConnectionMultiplexer directly if needed.
        // This is a no-op placeholder; a full implementation would scan keys by pattern.
        return Task.CompletedTask;
    }
}
