using KurdMap.Domain.Reviews.Entities;

namespace KurdMap.Domain.Reviews;

public interface IReviewRepository
{
    Task<List<Review>> GetByBusinessIdAsync(Guid businessId, CancellationToken ct = default);
    Task<List<Review>> GetAllAsync(bool? approvedOnly, CancellationToken ct = default);
    Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid businessId, Guid userId, CancellationToken ct = default);
    Task AddAsync(Review review, CancellationToken ct = default);
    void Remove(Review review);
}
