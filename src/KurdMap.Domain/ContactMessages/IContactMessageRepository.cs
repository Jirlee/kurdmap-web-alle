using KurdMap.Domain.ContactMessages.Entities;

namespace KurdMap.Domain.ContactMessages;

public interface IContactMessageRepository
{
    Task AddAsync(ContactMessage message, CancellationToken ct = default);
    Task<List<ContactMessage>> GetAllAsync(CancellationToken ct = default);
    Task<ContactMessage?> GetByIdAsync(Guid id, CancellationToken ct = default);
}
