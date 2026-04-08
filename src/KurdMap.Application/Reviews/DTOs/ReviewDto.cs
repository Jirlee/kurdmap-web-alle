namespace KurdMap.Application.Reviews.DTOs;

public sealed record ReviewDto(
    Guid Id,
    Guid BusinessId,
    Guid UserId,
    string? UserFullName,
    int Rating,
    string? Comment,
    bool IsApproved,
    DateTime CreatedAt);
