using KurdMap.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace KurdMap.Infrastructure.Services;

/// <summary>
/// Structured security event logger. All events use consistent structured properties
/// for centralized log aggregation, SIEM integration, and forensic analysis.
/// </summary>
public sealed class SecurityLogger(ILogger<SecurityLogger> logger) : ISecurityLogger
{
    public void LogAuthSuccess(string userId, string email, string ipAddress, string userAgent)
    {
        logger.LogInformation(
            "SEC_AUTH_SUCCESS userId={UserId} email={Email} ip={IP} ua={UserAgent} time={Time}",
            userId, MaskEmail(email), ipAddress, SanitizeUserAgent(userAgent), DateTime.UtcNow);
    }

    public void LogAuthFailure(string identifier, string ipAddress, string userAgent, string reason)
    {
        logger.LogWarning(
            "SEC_AUTH_FAILURE identifier={Identifier} reason={Reason} ip={IP} ua={UserAgent} time={Time}",
            MaskEmail(identifier), reason, ipAddress, SanitizeUserAgent(userAgent), DateTime.UtcNow);
    }

    public void LogTokenRefresh(string userId, string ipAddress)
    {
        logger.LogInformation(
            "SEC_TOKEN_REFRESH userId={UserId} ip={IP} time={Time}",
            userId, ipAddress, DateTime.UtcNow);
    }

    public void LogTokenReplayAttack(string userId, string family, string ipAddress)
    {
        logger.LogCritical(
            "SEC_TOKEN_REPLAY_ATTACK userId={UserId} family={Family} ip={IP} time={Time}",
            userId, family, ipAddress, DateTime.UtcNow);
    }

    public void LogAccessDenied(string? userId, string resource, string method, string ipAddress)
    {
        logger.LogWarning(
            "SEC_ACCESS_DENIED userId={UserId} resource={Resource} method={Method} ip={IP} time={Time}",
            userId ?? "anonymous", resource, method, ipAddress, DateTime.UtcNow);
    }

    public void LogAccountLocked(string identifier, string ipAddress)
    {
        logger.LogWarning(
            "SEC_ACCOUNT_LOCKED identifier={Identifier} ip={IP} time={Time}",
            MaskEmail(identifier), ipAddress, DateTime.UtcNow);
    }

    public void LogPasswordReset(string userId, string ipAddress)
    {
        logger.LogInformation(
            "SEC_PASSWORD_RESET userId={UserId} ip={IP} time={Time}",
            userId, ipAddress, DateTime.UtcNow);
    }

    public void LogAccountDeleted(string userId, string ipAddress)
    {
        logger.LogWarning(
            "SEC_ACCOUNT_DELETED userId={UserId} ip={IP} time={Time}",
            userId, ipAddress, DateTime.UtcNow);
    }

    public void LogSuspiciousActivity(string? userId, string activity, string details, string ipAddress)
    {
        logger.LogCritical(
            "SEC_SUSPICIOUS userId={UserId} activity={Activity} details={Details} ip={IP} time={Time}",
            userId ?? "anonymous", activity, details, ipAddress, DateTime.UtcNow);
    }

    public void LogBruteForceBlocked(string ipAddress, int attemptCount)
    {
        logger.LogCritical(
            "SEC_BRUTE_FORCE_BLOCKED ip={IP} attempts={Attempts} time={Time}",
            ipAddress, attemptCount, DateTime.UtcNow);
    }

    public void LogRateLimitExceeded(string ipAddress, string endpoint)
    {
        logger.LogWarning(
            "SEC_RATE_LIMIT_EXCEEDED ip={IP} endpoint={Endpoint} time={Time}",
            ipAddress, endpoint, DateTime.UtcNow);
    }

    /// <summary>Masks email for logging: us***@domain.com</summary>
    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "[empty]";
        var parts = email.Split('@');
        if (parts.Length != 2) return "[invalid]";
        var local = parts[0];
        var masked = local.Length <= 2 ? "**" : $"{local[..2]}***";
        return $"{masked}@{parts[1]}";
    }

    /// <summary>Truncate user agent to prevent log injection</summary>
    private static string SanitizeUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return "[empty]";
        // Remove newlines/control chars to prevent log injection
        var sanitized = userAgent.Replace("\r", "").Replace("\n", "").Replace("\t", "");
        return sanitized.Length > 200 ? sanitized[..200] : sanitized;
    }
}
