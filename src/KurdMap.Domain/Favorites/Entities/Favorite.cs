using KurdMap.Domain.Common;

namespace KurdMap.Domain.Favorites.Entities;

public class Favorite : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public Guid UserId { get; private set; }

    private Favorite() { }

    public static Favorite Create(Guid businessId, Guid userId)
    {
        return new Favorite
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
