using KurdMap.Domain.Cities.Entities;

namespace KurdMap.Domain.Cities;

public interface ICityRepository
{
    Task<List<City>> GetAllAsync(CancellationToken ct = default);
    Task<City?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<City?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task AddAsync(City city, CancellationToken ct = default);
    void Update(City city);
    void Remove(City city);
}
