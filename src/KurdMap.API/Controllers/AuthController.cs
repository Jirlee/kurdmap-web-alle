using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Users.Entities;
using KurdMap.Infrastructure.Identity;
using KurdMap.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    IJwtTokenService jwtTokenService,
    ISecurityLogger securityLogger,
    ITokenBlacklistService tokenBlacklist,
    IOptions<JwtSettings> jwtSettings,
    AppDbContext db) : ControllerBase
{
    private const string RefreshTokenCookieName = "KurdMap_RefreshToken";
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var ip = GetClientIp();
        var ua = GetUserAgent();

        // If a confirmation password is supplied, it must match.
        if (request.ConfirmPassword is not null && request.ConfirmPassword != request.Password)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["ConfirmPassword"] = ["The password and confirmation password do not match."]
            }));
        }

        // FullName is optional in the request; fall back to the local-part of the email.
        var fullName = string.IsNullOrWhiteSpace(request.FullName)
            ? request.Email.Split('@')[0]
            : request.FullName.Trim();

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = fullName
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            securityLogger.LogAuthFailure(request.Email, ip, ua, "registration_failed");
            var errors = result.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        await userManager.AddToRoleAsync(user, "User");

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var (refreshTokenValue, family) = await CreateAndStoreRefreshTokenAsync(user.Id, ip);

        securityLogger.LogAuthSuccess(user.Id.ToString(), user.Email!, ip, ua);
        SetRefreshTokenCookie(refreshTokenValue);
        return Ok(new AuthResponse(accessToken, refreshTokenValue, user.Id, user.Email!, user.FullName, roles,
            RequiresTwoFactor: false, TwoFactorEnabled: false));
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = GetClientIp();
        var ua = GetUserAgent();

        // Check account lockout first
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is not null && await userManager.IsLockedOutAsync(user))
        {
            securityLogger.LogAccountLocked(request.Email, ip);
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Account locked",
                detail: "Account is temporarily locked due to multiple failed attempts.");
        }

        if (user is null || !user.IsActive || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            // Increment lockout counter on failure
            if (user is not null)
                await userManager.AccessFailedAsync(user);

            securityLogger.LogAuthFailure(request.Email, ip, ua, "invalid_credentials");
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid credentials",
                detail: "Email or password is incorrect.");
        }

        // Reset lockout counter on success
        await userManager.ResetAccessFailedCountAsync(user);

        // Check if 2FA is enabled — require TOTP verification
        var twoFactorEnabled = await userManager.GetTwoFactorEnabledAsync(user);
        if (twoFactorEnabled)
        {
            return Ok(new AuthResponse("", "", user.Id, user.Email!, user.FullName, [],
                RequiresTwoFactor: true, TwoFactorEnabled: true));
        }

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var (refreshTokenValue, family) = await CreateAndStoreRefreshTokenAsync(user.Id, ip);

        securityLogger.LogAuthSuccess(user.Id.ToString(), user.Email!, ip, ua);
        SetRefreshTokenCookie(refreshTokenValue);
        return Ok(new AuthResponse(accessToken, refreshTokenValue, user.Id, user.Email!, user.FullName, roles,
            RequiresTwoFactor: false, TwoFactorEnabled: false));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var ip = GetClientIp();

        // Find the stored refresh token
        var storedToken = await db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken is null)
        {
            securityLogger.LogSuspiciousActivity(null, "invalid_refresh_token",
                "Refresh attempt with unknown token", ip);
            return UnauthorizedRefresh();
        }

        // ── REPLAY ATTACK DETECTION ──────────────────────────────────────
        // If this token was already revoked, someone is reusing a stolen token.
        // Revoke the ENTIRE token family to protect the user.
        if (storedToken.IsRevoked)
        {
            securityLogger.LogTokenReplayAttack(
                storedToken.UserId.ToString(), storedToken.Family, ip);

            // Revoke all tokens in this family
            await RevokeTokenFamilyAsync(storedToken.Family, ip);
            return UnauthorizedRefresh();
        }

        // Check expiry
        if (storedToken.IsExpired)
        {
            securityLogger.LogAuthFailure(storedToken.UserId.ToString(), ip, "", "refresh_token_expired");
            return UnauthorizedRefresh();
        }

        // Check user is still active
        var user = storedToken.User;
        if (user is null || !user.IsActive)
            return UnauthorizedRefresh();

        // ── ROTATION: Revoke old token, issue new one ─────────────────────
        var newRefreshTokenValue = jwtTokenService.GenerateRefreshToken();
        storedToken.Revoke(ip, newRefreshTokenValue);

        var newStoredToken = RefreshToken.Create(
            newRefreshTokenValue,
            user.Id,
            storedToken.Family, // Same family for chain tracking
            ip,
            _jwtSettings.RefreshTokenExpirationDays);

        db.RefreshTokens.Add(newStoredToken);
        await db.SaveChangesAsync();

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);

        securityLogger.LogTokenRefresh(user.Id.ToString(), ip);
        SetRefreshTokenCookie(newRefreshTokenValue);
        var twoFa = await userManager.GetTwoFactorEnabledAsync(user);
        return Ok(new AuthResponse(accessToken, newRefreshTokenValue, user.Id, user.Email!, user.FullName, roles,
            TwoFactorEnabled: twoFa));
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        var ip = GetClientIp();
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Blacklist the current access token's JTI
        var jti = User.FindFirstValue("jti");
        if (!string.IsNullOrEmpty(jti))
        {
            await tokenBlacklist.BlacklistAsync(jti, TimeSpan.FromMinutes(_jwtSettings.AccessTokenExpirationMinutes));
        }

        // Revoke all active refresh tokens for this user
        if (userId is not null && Guid.TryParse(userId, out var uid))
        {
            await db.RefreshTokens
                .Where(rt => rt.UserId == uid && rt.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                    .SetProperty(rt => rt.RevokedByIp, ip));
        }

        // Clear refresh token cookie
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth",
            Secure = true,
            SameSite = SameSiteMode.Strict
        });
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var ip = GetClientIp();
        var user = await userManager.FindByEmailAsync(request.Email);

        // Always return OK to prevent email enumeration attacks
        if (user is null || !user.IsActive)
            return Ok(new { message = "If the email exists, a reset link has been sent." });

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        // TODO: Send token via email service (e.g. SendGrid, SMTP)
        // In production, this MUST be sent via a secure email channel
        // await emailService.SendPasswordResetEmailAsync(user.Email!, token);

        securityLogger.LogPasswordReset(user.Id.ToString(), ip);
        return Ok(new { message = "If the email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var ip = GetClientIp();
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Reset failed",
                detail: "Unable to reset password.");
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        // Revoke all refresh tokens after password reset (force re-login everywhere)
        await db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                .SetProperty(rt => rt.RevokedByIp, ip));

        securityLogger.LogPasswordReset(user.Id.ToString(), ip);
        return Ok(new { message = "Password has been reset successfully." });
    }

    [HttpDelete("delete-account")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        var ip = GetClientIp();
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Delete failed",
                detail: "Unable to delete account.");
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            securityLogger.LogAuthFailure(request.Email, ip, GetUserAgent(), "delete_wrong_password");
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid credentials",
                detail: "Password is incorrect.");
        }

        // Soft delete: deactivate and anonymize PII (GDPR compliance)
        user.IsActive = false;
        user.FullName = "Deleted User";
        user.Email = $"deleted_{user.Id}@kurdmap.de";
        user.NormalizedEmail = user.Email.ToUpperInvariant();
        user.UserName = user.Email;
        user.NormalizedUserName = user.NormalizedEmail;
        user.PhoneNumber = null;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Delete failed",
                detail: "Unable to delete account.");
        }

        // Revoke all refresh tokens
        await db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                .SetProperty(rt => rt.RevokedByIp, ip));

        // Clear refresh token cookie
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth",
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        securityLogger.LogAccountDeleted(user.Id.ToString(), ip);
        return Ok(new { message = "Account has been deleted successfully." });
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private async Task<(string Token, string Family)> CreateAndStoreRefreshTokenAsync(Guid userId, string ip)
    {
        var tokenValue = jwtTokenService.GenerateRefreshToken();
        var family = Guid.NewGuid().ToString("N"); // New family for each login

        var storedToken = RefreshToken.Create(
            tokenValue, userId, family, ip, _jwtSettings.RefreshTokenExpirationDays);

        db.RefreshTokens.Add(storedToken);
        await db.SaveChangesAsync();

        return (tokenValue, family);
    }

    private async Task RevokeTokenFamilyAsync(string family, string ip)
    {
        await db.RefreshTokens
            .Where(rt => rt.Family == family && rt.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                .SetProperty(rt => rt.RevokedByIp, ip));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });
    }

    private IActionResult UnauthorizedRefresh() => Problem(
        statusCode: StatusCodes.Status401Unauthorized,
        title: "Invalid refresh",
        detail: "Unable to refresh token.");

    private string GetClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var firstIp = forwarded.Split(',', StringSplitOptions.TrimEntries)[0];
            if (System.Net.IPAddress.TryParse(firstIp, out _))
                return firstIp;
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetUserAgent() =>
        Request.Headers.UserAgent.ToString();

    // ── TOTP / 2FA Endpoints ──────────────────────────────────────────

    [HttpPost("totp/setup")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetupTotp()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var key = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            key = await userManager.GetAuthenticatorKeyAsync(user);
        }

        var qrUri = $"otpauth://totp/KurdMap:{user.Email}?secret={key}&issuer=KurdMap&digits=6";

        return Ok(new TotpSetupResponse(key!, qrUri));
    }

    [HttpPost("totp/enable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EnableTotp([FromBody] TotpVerifyRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user, userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
            return Problem(statusCode: 400, title: "Invalid code", detail: "The verification code is incorrect.");

        await userManager.SetTwoFactorEnabledAsync(user, true);

        securityLogger.LogSuspiciousActivity(userId, "totp_enabled", "User enabled TOTP 2FA", GetClientIp());
        return Ok(new { message = "Two-factor authentication has been enabled." });
    }

    [HttpPost("totp/disable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DisableTotp([FromBody] TotpVerifyRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user, userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
            return Problem(statusCode: 400, title: "Invalid code", detail: "The verification code is incorrect.");

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);

        securityLogger.LogSuspiciousActivity(userId, "totp_disabled", "User disabled TOTP 2FA", GetClientIp());
        return Ok(new { message = "Two-factor authentication has been disabled." });
    }

    [HttpPost("verify-totp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyTotp([FromBody] TotpLoginVerifyRequest request)
    {
        var ip = GetClientIp();
        var user = await userManager.FindByIdAsync(request.UserId);
        if (user is null || !user.IsActive)
            return Problem(statusCode: 401, title: "Invalid", detail: "Verification failed.");

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user, userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
        {
            await userManager.AccessFailedAsync(user);
            securityLogger.LogAuthFailure(user.Email ?? "", ip, GetUserAgent(), "totp_code_invalid");
            return Problem(statusCode: 401, title: "Invalid code", detail: "The verification code is incorrect.");
        }

        await userManager.ResetAccessFailedCountAsync(user);
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var (refreshTokenValue, _) = await CreateAndStoreRefreshTokenAsync(user.Id, ip);

        securityLogger.LogAuthSuccess(user.Id.ToString(), user.Email!, ip, GetUserAgent());
        SetRefreshTokenCookie(refreshTokenValue);
        return Ok(new AuthResponse(accessToken, refreshTokenValue, user.Id, user.Email!, user.FullName, roles,
            RequiresTwoFactor: false, TwoFactorEnabled: true));
    }
}

public sealed record RegisterRequest(
    [Required] string Email,
    [Required] string Password,
    string? FullName = null,
    string? ConfirmPassword = null);

public sealed record LoginRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record RefreshRequest(
    [Required] string RefreshToken);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string Email,
    string FullName,
    IList<string> Roles,
    bool RequiresTwoFactor = false,
    bool TwoFactorEnabled = false);

public sealed record ForgotPasswordRequest(
    [Required] string Email);

public sealed record ResetPasswordRequest(
    [Required] string Email,
    [Required] string Token,
    [Required] string NewPassword);

public sealed record DeleteAccountRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record TotpSetupResponse(string SharedKey, string QrCodeUri);

public sealed record TotpVerifyRequest([Required] string Code);

public sealed record TotpLoginVerifyRequest(
    [Required] string UserId,
    [Required] string Code);
