using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Favorites.Commands.ToggleFavorite;
using KurdMap.Application.Favorites.DTOs;
using KurdMap.Application.Favorites.Queries.GetUserFavorites;
using KurdMap.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/favorites")]
[Authorize]
[EnableRateLimiting("fixed")]
public class FavoritesController(ISender sender, ICurrentUserService currentUser) : BaseApiController
{
    [HttpGet("{userId:guid}")]
    [ProducesResponseType(typeof(List<FavoriteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUserFavorites(Guid userId, CancellationToken ct)
    {
        // Broken access control protection: a user may only read their own
        // favorites (admins/moderators may inspect any user's favorites).
        if (currentUser.UserId != userId && !IsPrivileged())
            return Forbid();

        return OkOrBadRequest(await sender.Send(new GetUserFavoritesQuery(userId), ct));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ToggleFavoriteResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Toggle([FromBody] ToggleFavoriteCommand command, CancellationToken ct)
    {
        // Never trust a client-supplied user id — always act on the caller.
        if (currentUser.UserId is not { } uid)
            return Unauthorized();

        return OkOrBadRequest(await sender.Send(command with { UserId = uid }, ct));
    }

    private bool IsPrivileged()
        => currentUser.Roles.Any(r =>
            r is AppRoles.SuperAdmin or AppRoles.Admin or AppRoles.Moderator);
}
