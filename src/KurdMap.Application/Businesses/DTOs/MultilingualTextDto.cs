namespace KurdMap.Application.Businesses.DTOs;

public sealed record MultilingualTextDto(
    string Ku,
    string? Kmr,
    string De,
    string? En);
