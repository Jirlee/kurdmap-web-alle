using KurdMap.Domain.ContactMessages;
using KurdMap.Domain.ContactMessages.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public class ContactMessageRepository(AppDbContext db) : IContactMessageRepository
{
    public async Task AddAsync(ContactMessage message, CancellationToken ct)
        => await db.ContactMessages.AddAsync(message, ct);

    public async Task<List<ContactMessage>> GetAllAsync(CancellationToken ct)
        => await db.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

    public async Task<ContactMessage?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.ContactMessages.FirstOrDefaultAsync(m => m.Id == id, ct);
}
