using KurdMap.Domain.Categories;
using KurdMap.Domain.Categories.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public sealed class CategoryRepository(AppDbContext context) : ICategoryRepository
{
    public async Task<List<Category>> GetAllAsync(CancellationToken ct = default)
        => await context.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync(ct);

    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Category?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await context.Categories.FirstOrDefaultAsync(c => c.Slug == slug, ct);

    public async Task AddAsync(Category category, CancellationToken ct = default)
        => await context.Categories.AddAsync(category, ct);

    public void Update(Category category)
        => context.Categories.Update(category);

    public void Remove(Category category)
        => context.Categories.Remove(category);
}
