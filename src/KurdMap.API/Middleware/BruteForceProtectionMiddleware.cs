using System.Collections.Concurrent;
using System.Net;
using KurdMap.Application.Common.Interfaces;

namespace KurdMap.API.Middleware;

/// <summary>
/// IP-based brute force protection with progressive lockout.
/// Tracks failed auth attempts per IP and blocks after threshold.
/// Uses in-memory cache with automatic cleanup.
/// </summary>
public sealed class BruteForceProtectionMiddleware(
    RequestDelegate next,
    ILogger<BruteForceProtectionMiddleware> logger)
{
    // Track failed attempts per IP: IP → (count, firstAttempt, blockedUntil)
    private static readonly ConcurrentDictionary<string, AttackTracker> Trackers = new();
    private static DateTime _lastCleanup = DateTime.UtcNow;

    private const int MaxFailedAttempts = 10;
    private const int LockoutMinutes = 15;
    private const int TrackingWindowMinutes = 5;
    private const int CleanupIntervalMinutes = 10;

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = GetClientIp(context);
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        // Only enforce on auth endpoints
        if (!IsAuthEndpoint(path))
        {
            await next(context);
            return;
        }

        // Periodic cleanup of old entries
        CleanupStaleEntries();

        // Check if IP is currently blocked
        if (Trackers.TryGetValue(ip, out var tracker) && tracker.IsBlocked)
        {
            var securityLogger = context.RequestServices.GetService<ISecurityLogger>();
            securityLogger?.LogBruteForceBlocked(ip, tracker.FailedAttempts);

            logger.LogWarning("SEC_BRUTE_FORCE ip={IP} blocked until {Until}", ip, tracker.BlockedUntil);

            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.Headers["Retry-After"] = LockoutMinutes.ToString();
            await context.Response.WriteAsJsonAsync(new
            {
                status = 429,
                title = "Too Many Requests",
                detail = $"Too many failed attempts. Try again after {LockoutMinutes} minutes."
            });
            return;
        }

        await next(context);

        // Track failed auth (401) responses
        if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
        {
            RecordFailure(ip);
        }
        else if (context.Response.StatusCode == (int)HttpStatusCode.OK && IsAuthEndpoint(path))
        {
            // Reset on successful auth
            Trackers.TryRemove(ip, out _);
        }
    }

    private static void RecordFailure(string ip)
    {
        var tracker = Trackers.GetOrAdd(ip, _ => new AttackTracker());

        // Reset if tracking window expired
        if (tracker.FirstAttempt.AddMinutes(TrackingWindowMinutes) < DateTime.UtcNow)
        {
            tracker.Reset();
        }

        tracker.FailedAttempts++;

        if (tracker.FailedAttempts >= MaxFailedAttempts)
        {
            tracker.BlockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
        }
    }

    private static void CleanupStaleEntries()
    {
        if (DateTime.UtcNow - _lastCleanup < TimeSpan.FromMinutes(CleanupIntervalMinutes))
            return;

        _lastCleanup = DateTime.UtcNow;
        var staleKeys = Trackers
            .Where(kv => !kv.Value.IsBlocked &&
                         kv.Value.FirstAttempt.AddMinutes(TrackingWindowMinutes * 2) < DateTime.UtcNow)
            .Select(kv => kv.Key)
            .ToList();

        foreach (var key in staleKeys)
            Trackers.TryRemove(key, out _);
    }

    private static string GetClientIp(HttpContext context)
    {
        // Check X-Forwarded-For for reverse proxy setups (take first/leftmost = original client)
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var firstIp = forwarded.Split(',', StringSplitOptions.TrimEntries)[0];
            if (IPAddress.TryParse(firstIp, out _))
                return firstIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static bool IsAuthEndpoint(string path) =>
        path.Contains("/api/auth/login") ||
        path.Contains("/api/auth/register") ||
        path.Contains("/api/auth/forgot-password") ||
        path.Contains("/api/auth/reset-password") ||
        path.Contains("/api/auth/refresh");

    private sealed class AttackTracker
    {
        public int FailedAttempts { get; set; }
        public DateTime FirstAttempt { get; private set; } = DateTime.UtcNow;
        public DateTime? BlockedUntil { get; set; }

        public bool IsBlocked => BlockedUntil.HasValue && BlockedUntil.Value > DateTime.UtcNow;

        public void Reset()
        {
            FailedAttempts = 0;
            FirstAttempt = DateTime.UtcNow;
            BlockedUntil = null;
        }
    }
}
