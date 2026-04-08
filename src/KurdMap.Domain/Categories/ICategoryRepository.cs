using KurdMap.Domain.Categories.Entities;

namespace KurdMap.Domain.Categories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync(CancellationToken ct = default);
    Task<Category?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Category?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    void Update(Category category);
    void Remove(Category category);
}
