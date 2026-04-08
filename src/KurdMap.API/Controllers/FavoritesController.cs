using KurdMap.Application.Favorites.Commands.ToggleFavorite;
using KurdMap.Application.Favorites.DTOs;
using KurdMap.Application.Favorites.Queries.GetUserFavorites;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/favorites")]
[Authorize]
[EnableRateLimiting("fixed")]
public class FavoritesController(ISender sender) : BaseApiController
{
    [HttpGet("{userId:guid}")]
    [ProducesResponseType(typeof(List<FavoriteDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserFavorites(Guid userId, CancellationToken ct)
        => OkOrBadRequest(await sender.Send(new GetUserFavoritesQuery(userId), ct));

    [HttpPost]
    [ProducesResponseType(typeof(ToggleFavoriteResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Toggle([FromBody] ToggleFavoriteCommand command, CancellationToken ct)
        => OkOrBadRequest(await sender.Send(command, ct));
}
