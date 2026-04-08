using KurdMap.Domain.Users.Entities;

namespace KurdMap.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    string GenerateRefreshToken();
}
