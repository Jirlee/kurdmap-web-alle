namespace KurdMap.Application.Cities.DTOs;

public sealed record CityDto(
    Guid Id,
    string Slug,
    string NameKu,
    string? NameKmr,
    string NameDe,
    string? NameEn,
    decimal Latitude,
    decimal Longitude);
