using KurdMap.Application.Common.Models;
using KurdMap.Application.Favorites.DTOs;
using KurdMap.Domain.Favorites;
using MediatR;

namespace KurdMap.Application.Favorites.Queries.GetUserFavorites;

public sealed record GetUserFavoritesQuery(Guid UserId) : IRequest<Result<List<FavoriteDto>>>;

public sealed class GetUserFavoritesQueryHandler(
    IFavoriteRepository favoriteRepository) : IRequestHandler<GetUserFavoritesQuery, Result<List<FavoriteDto>>>
{
    public async Task<Result<List<FavoriteDto>>> Handle(GetUserFavoritesQuery request, CancellationToken ct)
    {
        var favorites = await favoriteRepository.GetByUserIdAsync(request.UserId, ct);
        var dtos = favorites.Select(f => new FavoriteDto(
            f.Id, f.BusinessId, f.UserId, f.CreatedAt)).ToList();
        return Result<List<FavoriteDto>>.Success(dtos);
    }
}
