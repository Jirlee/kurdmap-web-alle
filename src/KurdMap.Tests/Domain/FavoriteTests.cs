using KurdMap.Domain.Favorites.Entities;

namespace KurdMap.Tests.Domain;

public class FavoriteTests
{
    [Fact]
    public void Create_ShouldSetProperties()
    {
        var businessId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var favorite = Favorite.Create(businessId, userId);

        Assert.Equal(businessId, favorite.BusinessId);
        Assert.Equal(userId, favorite.UserId);
        Assert.NotEqual(Guid.Empty, favorite.Id);
        Assert.True(favorite.CreatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public void Create_MultipleTimes_ShouldGenerateUniqueIds()
    {
        var fav1 = Favorite.Create(Guid.NewGuid(), Guid.NewGuid());
        var fav2 = Favorite.Create(Guid.NewGuid(), Guid.NewGuid());

        Assert.NotEqual(fav1.Id, fav2.Id);
    }
}
