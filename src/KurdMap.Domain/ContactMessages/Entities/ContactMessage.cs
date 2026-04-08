using KurdMap.Domain.Common;

namespace KurdMap.Domain.ContactMessages.Entities;

public class ContactMessage : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public bool IsRead { get; private set; }

    private ContactMessage() { }

    public static ContactMessage Create(string name, string email, string message)
    {
        return new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Message = message.Trim(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
