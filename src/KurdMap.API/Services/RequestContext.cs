using System.Security.Claims;
using KurdMap.Application.Common.Interfaces;

namespace KurdMap.API.Services;

public sealed class RequestContext(IHttpContextAccessor httpContextAccessor) : IRequestContext
{
    public Guid? UserId
    {
        get
        {
            var sub = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Email
        => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);

    public IReadOnlyList<string> Roles
        => httpContextAccessor.HttpContext?.User
            .FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList()
            .AsReadOnly() ?? (IReadOnlyList<string>)[];

    public bool IsAuthenticated
        => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public string? CorrelationId
        => httpContextAccessor.HttpContext?.Response.Headers["X-Correlation-Id"].FirstOrDefault();

    public string? IpAddress
        => httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public DateTime RequestTimestamp { get; } = DateTime.UtcNow;
}
