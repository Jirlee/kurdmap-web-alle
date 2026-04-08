using KurdMap.Domain.Cities;
using KurdMap.Domain.Cities.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public sealed class CityRepository(AppDbContext context) : ICityRepository
{
    public async Task<List<City>> GetAllAsync(CancellationToken ct = default)
        => await context.Cities.AsNoTracking().OrderBy(c => c.Name.De).ToListAsync(ct);

    public async Task<City?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Cities.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<City?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await context.Cities.FirstOrDefaultAsync(c => c.Slug == slug, ct);

    public async Task AddAsync(City city, CancellationToken ct = default)
        => await context.Cities.AddAsync(city, ct);

    public void Update(City city)
        => context.Cities.Update(city);

    public void Remove(City city)
        => context.Cities.Remove(city);
}
