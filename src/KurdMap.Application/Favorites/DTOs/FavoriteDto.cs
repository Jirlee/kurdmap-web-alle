namespace KurdMap.Application.Favorites.DTOs;

public sealed record FavoriteDto(
    Guid Id,
    Guid BusinessId,
    Guid UserId,
    DateTime CreatedAt);
