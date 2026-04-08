using KurdMap.Application.Common.Models;
using KurdMap.Application.Favorites.DTOs;
using KurdMap.Domain.Common;
using KurdMap.Domain.Favorites;
using KurdMap.Domain.Favorites.Entities;
using MediatR;

namespace KurdMap.Application.Favorites.Commands.ToggleFavorite;

public sealed record ToggleFavoriteCommand(
    Guid BusinessId,
    Guid UserId) : IRequest<Result<ToggleFavoriteResult>>;

public sealed record ToggleFavoriteResult(bool IsFavorited);

public sealed class ToggleFavoriteCommandHandler(
    IFavoriteRepository favoriteRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<ToggleFavoriteCommand, Result<ToggleFavoriteResult>>
{
    public async Task<Result<ToggleFavoriteResult>> Handle(ToggleFavoriteCommand request, CancellationToken ct)
    {
        var existing = await favoriteRepository.GetAsync(request.BusinessId, request.UserId, ct);

        if (existing is not null)
        {
            favoriteRepository.Remove(existing);
            await unitOfWork.SaveChangesAsync(ct);
            return new ToggleFavoriteResult(false);
        }

        var favorite = Favorite.Create(request.BusinessId, request.UserId);
        await favoriteRepository.AddAsync(favorite, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return new ToggleFavoriteResult(true);
    }
}
