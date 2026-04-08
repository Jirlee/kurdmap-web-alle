using System.Net;

namespace KurdMap.API.Middleware;

/// <summary>
/// Enforces maximum request body size to prevent DoS via oversized payloads.
/// Default: 10 MB for general requests, 5 MB for auth endpoints.
/// </summary>
public sealed class RequestSizeLimitMiddleware(RequestDelegate next)
{
    private const long DefaultMaxBodySize = 10 * 1024 * 1024;  // 10 MB
    private const long AuthMaxBodySize = 1 * 1024 * 1024;      // 1 MB for auth

    public async Task InvokeAsync(HttpContext context)
    {
        var contentLength = context.Request.ContentLength;
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        var maxSize = path.Contains("/api/auth/") ? AuthMaxBodySize : DefaultMaxBodySize;

        if (contentLength > maxSize)
        {
            context.Response.StatusCode = (int)HttpStatusCode.RequestEntityTooLarge;
            await context.Response.WriteAsJsonAsync(new
            {
                status = 413,
                title = "Payload Too Large",
                detail = $"Request body exceeds the maximum allowed size of {maxSize / (1024 * 1024)} MB."
            });
            return;
        }

        await next(context);
    }
}
