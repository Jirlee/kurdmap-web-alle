namespace KurdMap.Application.ContactMessages.DTOs;

public sealed record ContactMessageDto(
    Guid Id,
    string Name,
    string Email,
    string Message,
    bool IsRead,
    DateTime CreatedAt);
