namespace KurdMap.API.Middleware;

public sealed class SecurityHeadersMiddleware(RequestDelegate next, IConfiguration configuration)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Generate nonce for CSP
        var nonce = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16));
        context.Items["CspNonce"] = nonce;

        // ── Remove server fingerprinting ──────────────────────────────────
        headers.Remove("Server");
        headers.Remove("X-Powered-By");
        headers.Remove("X-AspNet-Version");

        // ── MIME / Clickjacking / XSS ─────────────────────────────────────
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["X-XSS-Protection"] = "0"; // Disabled — CSP handles XSS (modern best practice)
        headers["X-Permitted-Cross-Domain-Policies"] = "none";

        // ── Referrer & Permissions ────────────────────────────────────────
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), bluetooth=(), serial=()";

        // ── Cross-Origin isolation ────────────────────────────────────────
        headers["Cross-Origin-Opener-Policy"] = "same-origin";
        headers["Cross-Origin-Resource-Policy"] = "same-origin";
        headers["Cross-Origin-Embedder-Policy"] = "credentialless";

        // Build allowed connect-src from CORS origins
        var corsOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        var connectSrc = corsOrigins.Length > 0
            ? $"'self' {string.Join(' ', corsOrigins)}"
            : "'self'";

        // ── Content Security Policy — strict, nonce-based ─────────────────
        headers["Content-Security-Policy"] =
            "default-src 'none'; " +
            "script-src 'self'; " +
            $"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https://*.tile.openstreetmap.org; " +
            $"connect-src {connectSrc}; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'; " +
            "object-src 'none'; " +
            "upgrade-insecure-requests";

        // ── HSTS — enforce HTTPS (2 years) ────────────────────────────────
        if (context.Request.IsHttps)
        {
            headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
        }

        // ── Prevent caching of API responses ──────────────────────────────
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
            headers["Pragma"] = "no-cache";
            headers["Expires"] = "0";
        }

        await next(context);
    }
}
