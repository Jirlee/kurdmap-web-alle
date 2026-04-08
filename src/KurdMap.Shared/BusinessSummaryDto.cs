using KurdMap.Domain.Enums;

namespace KurdMap.Shared
{
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
        string? PrimaryImageUrl);
}
