using KurdMap.Domain.Enums;

namespace KurdMap.Application.Businesses.DTOs;

public sealed record BusinessDetailDto(
    Guid Id,
    string Slug,
    MultilingualTextDto Name,
    MultilingualTextDto Description,
    Guid CategoryId,
    string Street,
    string PostalCode,
    Guid CityId,
    decimal Latitude,
    decimal Longitude,
    string? Phone,
    string? Email,
    string? Website,
    OpeningHoursDto? Hours,
    BusinessStatus Status,
    bool IsVerified,
    bool IsFeatured,
    Guid? OwnerId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<BusinessImageDto> Images,
    List<BusinessServiceDto> Services,
    List<MenuItemDto> MenuItems,
    int? DiscountPercentage = null,
    MultilingualTextDto? DiscountDescription = null,
    DateTime? DiscountStartDate = null,
    DateTime? DiscountEndDate = null,
    bool HasActiveDiscount = false);

public sealed record BusinessImageDto(
    Guid Id,
    string Url,
    string? AltText,
    bool IsPrimary,
    int SortOrder);

public sealed record BusinessServiceDto(
    Guid Id,
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    int SortOrder);

public sealed record MenuItemDto(
    Guid Id,
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    string? ImageUrl,
    int SortOrder);

public sealed record OpeningHoursDto(
    DayScheduleDto? Monday,
    DayScheduleDto? Tuesday,
    DayScheduleDto? Wednesday,
    DayScheduleDto? Thursday,
    DayScheduleDto? Friday,
    DayScheduleDto? Saturday,
    DayScheduleDto? Sunday);

public sealed record DayScheduleDto(
    string? Open,
    string? Close,
    bool Closed);
