using KurdMap.Domain.Reviews;
using KurdMap.Domain.Reviews.Entities;
using KurdMap.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public class ReviewRepository(AppDbContext db) : IReviewRepository
{
    public async Task<List<Review>> GetByBusinessIdAsync(Guid businessId, CancellationToken ct)
        => await db.Reviews
            .Where(r => r.BusinessId == businessId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task<List<Review>> GetAllAsync(bool? approvedOnly, CancellationToken ct)
    {
        var query = db.Reviews.AsQueryable();
        if (approvedOnly == true) query = query.Where(r => r.IsApproved);
        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
    }

    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<bool> ExistsAsync(Guid businessId, Guid userId, CancellationToken ct)
        => await db.Reviews.AnyAsync(r => r.BusinessId == businessId && r.UserId == userId, ct);

    public async Task AddAsync(Review review, CancellationToken ct)
        => await db.Reviews.AddAsync(review, ct);

    public void Remove(Review review)
        => db.Reviews.Remove(review);
}
