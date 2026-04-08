using KurdMap.Domain.Favorites;
using KurdMap.Domain.Favorites.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public class FavoriteRepository(AppDbContext db) : IFavoriteRepository
{
    public async Task<List<Favorite>> GetByUserIdAsync(Guid userId, CancellationToken ct)
        => await db.Favorites
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

    public async Task<bool> ExistsAsync(Guid businessId, Guid userId, CancellationToken ct)
        => await db.Favorites.AnyAsync(f => f.BusinessId == businessId && f.UserId == userId, ct);

    public async Task<Favorite?> GetAsync(Guid businessId, Guid userId, CancellationToken ct)
        => await db.Favorites.FirstOrDefaultAsync(f => f.BusinessId == businessId && f.UserId == userId, ct);

    public async Task AddAsync(Favorite favorite, CancellationToken ct)
        => await db.Favorites.AddAsync(favorite, ct);

    public void Remove(Favorite favorite)
        => db.Favorites.Remove(favorite);
}
