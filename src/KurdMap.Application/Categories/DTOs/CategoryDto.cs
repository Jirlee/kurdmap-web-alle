namespace KurdMap.Application.Categories.DTOs;

public sealed record CategoryDto(
    Guid Id,
    string Slug,
    string NameKu,
    string? NameKmr,
    string NameDe,
    string? NameEn,
    string? Icon,
    int SortOrder);
