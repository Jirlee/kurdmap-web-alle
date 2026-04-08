using KurdMap.Domain.Advertisements.Entities;

namespace KurdMap.Domain.Advertisements;

public interface IAdvertisementRepository
{
    Task<List<Advertisement>> GetAllAsync(CancellationToken ct = default);
    Task<List<Advertisement>> GetActiveAsync(CancellationToken ct = default);
    Task<Advertisement?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Advertisement advertisement, CancellationToken ct = default);
    void Update(Advertisement advertisement);
    void Remove(Advertisement advertisement);
}
