using KurdMap.Domain.Enums;

namespace KurdMap.Application.Businesses.DTOs;

public sealed record BusinessSummaryDto(
    Guid Id,
    string Slug,
    MultilingualTextDto Name,
    Guid CategoryId,
    string? CategorySlug,
    string Street,
    string PostalCode,
    decimal Latitude,
    decimal Longitude,
    string? Phone,
    BusinessStatus Status,
    bool IsVerified,
    bool IsFeatured,
    string? PrimaryImageUrl,
    int? DiscountPercentage = null,
    MultilingualTextDto? DiscountDescription = null,
    bool HasActiveDiscount = false);
