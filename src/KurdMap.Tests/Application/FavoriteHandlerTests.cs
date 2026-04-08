using KurdMap.Application.Favorites.Commands.ToggleFavorite;
using KurdMap.Application.Favorites.Queries.GetUserFavorites;
using KurdMap.Domain.Common;
using KurdMap.Domain.Favorites;
using KurdMap.Domain.Favorites.Entities;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class FavoriteHandlerTests
{
    private readonly IFavoriteRepository _favoriteRepo = Substitute.For<IFavoriteRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task ToggleFavorite_WhenNotExists_ShouldAddAndReturnTrue()
    {
        _favoriteRepo.GetAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Favorite?)null);

        var handler = new ToggleFavoriteCommandHandler(_favoriteRepo, _unitOfWork);
        var command = new ToggleFavoriteCommand(Guid.NewGuid(), Guid.NewGuid());

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value!.IsFavorited);
        await _favoriteRepo.Received(1).AddAsync(Arg.Any<Favorite>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ToggleFavorite_WhenExists_ShouldRemoveAndReturnFalse()
    {
        var existing = Favorite.Create(Guid.NewGuid(), Guid.NewGuid());
        _favoriteRepo.GetAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(existing);

        var handler = new ToggleFavoriteCommandHandler(_favoriteRepo, _unitOfWork);
        var command = new ToggleFavoriteCommand(existing.BusinessId, existing.UserId);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value!.IsFavorited);
        _favoriteRepo.Received(1).Remove(existing);
    }

    [Fact]
    public async Task GetUserFavorites_ShouldReturnMappedDtos()
    {
        var userId = Guid.NewGuid();
        var favorites = new List<Favorite>
        {
            Favorite.Create(Guid.NewGuid(), userId),
            Favorite.Create(Guid.NewGuid(), userId),
        };
        _favoriteRepo.GetByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(favorites);

        var handler = new GetUserFavoritesQueryHandler(_favoriteRepo);
        var result = await handler.Handle(new GetUserFavoritesQuery(userId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
        Assert.All(result.Value, f => Assert.Equal(userId, f.UserId));
    }
}
