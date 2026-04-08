using KurdMap.Domain.Businesses.Entities;

namespace KurdMap.Domain.Businesses;

public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Business?> GetBySlugAsync(string slug, CancellationToken ct = default);
    IQueryable<Business> GetQueryable();
    IQueryable<Business> ApplyFullTextSearch(IQueryable<Business> query, string searchTerm);
    IOrderedQueryable<Business> OrderBySearchRelevance(IQueryable<Business> query, string searchTerm);
    Task AddAsync(Business business, CancellationToken ct = default);
    void Update(Business business);
    void Remove(Business business);
}
