namespace KurdMap.Application.Common.Interfaces;

/// <summary>
/// Structured security event logger for audit trail and forensics.
/// All security events are logged with structured properties for analysis.
/// </summary>
public interface ISecurityLogger
{
    void LogAuthSuccess(string userId, string email, string ipAddress, string userAgent);
    void LogAuthFailure(string identifier, string ipAddress, string userAgent, string reason);
    void LogTokenRefresh(string userId, string ipAddress);
    void LogTokenReplayAttack(string userId, string family, string ipAddress);
    void LogAccessDenied(string? userId, string resource, string method, string ipAddress);
    void LogAccountLocked(string identifier, string ipAddress);
    void LogPasswordReset(string userId, string ipAddress);
    void LogAccountDeleted(string userId, string ipAddress);
    void LogSuspiciousActivity(string? userId, string activity, string details, string ipAddress);
    void LogBruteForceBlocked(string ipAddress, int attemptCount);
    void LogRateLimitExceeded(string ipAddress, string endpoint);
}
