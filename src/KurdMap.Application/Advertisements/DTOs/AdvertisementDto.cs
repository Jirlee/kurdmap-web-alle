namespace KurdMap.Application.Advertisements.DTOs;

public sealed record AdvertisementDto(
    Guid Id,
    string TitleKu,
    string? TitleKmr,
    string TitleDe,
    string? TitleEn,
    string? DescriptionKu,
    string? DescriptionDe,
    string ImageUrl,
    string? LinkUrl,
    Guid? BusinessId,
    DateTime StartDate,
    DateTime EndDate,
    bool IsActive,
    int SortOrder);
