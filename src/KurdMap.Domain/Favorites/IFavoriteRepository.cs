using KurdMap.Domain.Favorites.Entities;

namespace KurdMap.Domain.Favorites;

public interface IFavoriteRepository
{
    Task<List<Favorite>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid businessId, Guid userId, CancellationToken ct = default);
    Task<Favorite?> GetAsync(Guid businessId, Guid userId, CancellationToken ct = default);
    Task AddAsync(Favorite favorite, CancellationToken ct = default);
    void Remove(Favorite favorite);
}
