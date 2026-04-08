using KurdMap.Domain.Advertisements;
using KurdMap.Domain.Advertisements.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public sealed class AdvertisementRepository(AppDbContext context) : IAdvertisementRepository
{
    public async Task<List<Advertisement>> GetAllAsync(CancellationToken ct = default)
        => await context.Advertisements.AsNoTracking().OrderBy(a => a.SortOrder).ToListAsync(ct);

    public async Task<List<Advertisement>> GetActiveAsync(CancellationToken ct = default)
        => await context.Advertisements.AsNoTracking()
            .Where(a => a.IsActive && a.StartDate <= DateTime.UtcNow && a.EndDate >= DateTime.UtcNow)
            .OrderBy(a => a.SortOrder)
            .ToListAsync(ct);

    public async Task<Advertisement?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Advertisements.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(Advertisement advertisement, CancellationToken ct = default)
        => await context.Advertisements.AddAsync(advertisement, ct);

    public void Update(Advertisement advertisement)
        => context.Advertisements.Update(advertisement);

    public void Remove(Advertisement advertisement)
        => context.Advertisements.Remove(advertisement);
}
