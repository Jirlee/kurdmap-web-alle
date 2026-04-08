using System.Security.Claims;
using KurdMap.Application.Common.Interfaces;

namespace KurdMap.API.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
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
}
