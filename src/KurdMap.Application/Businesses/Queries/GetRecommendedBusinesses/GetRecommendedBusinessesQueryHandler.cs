using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Application.Businesses.Queries.GetRecommendedBusinesses;

public sealed class GetRecommendedBusinessesQueryHandler(
    IBusinessRepository businessRepository,
    ICacheService cacheService) : IRequestHandler<GetRecommendedBusinessesQuery, Result<RecommendedBusinessesDto>>
{
    private const int CacheTtlMinutes = 5;

    public async Task<Result<RecommendedBusinessesDto>> Handle(
        GetRecommendedBusinessesQuery request, CancellationToken ct)
    {
        var cacheKey = $"recommended:businesses:{request.Count}";
        var cached = await cacheService.GetAsync<RecommendedBusinessesDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var count = Math.Clamp(request.Count, 1, 50);
        var now = DateTime.UtcNow;

        // Featured businesses: verified + featured, ordered by newest
        var featured = await businessRepository.GetQueryable()
            .Where(b => b.Status == BusinessStatus.Active && b.IsFeatured)
            .OrderByDescending(b => b.IsVerified)
            .ThenByDescending(b => b.CreatedAt)
            .Take(count)
            .Select(b => new BusinessSummaryDto(
                b.Id, b.Slug,
                new MultilingualTextDto(b.Name.Ku, b.Name.Kmr, b.Name.De, b.Name.En),
                b.CategoryId, null,
                b.Address.Street, b.Address.PostalCode,
                b.Location.Latitude, b.Location.Longitude,
                b.Phone, b.Status, b.IsVerified, b.IsFeatured,
                b.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? b.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                b.DiscountPercentage,
                b.DiscountDescription != null
                    ? new MultilingualTextDto(b.DiscountDescription.Ku, b.DiscountDescription.Kmr, b.DiscountDescription.De, b.DiscountDescription.En)
                    : null,
                b.DiscountPercentage.HasValue && b.DiscountPercentage > 0
                    && (!b.DiscountStartDate.HasValue || b.DiscountStartDate <= now)
                    && (!b.DiscountEndDate.HasValue || b.DiscountEndDate > now)))
            .ToListAsync(ct);

        // Discounted businesses: active discount, ordered by highest discount %
        var discounted = await businessRepository.GetQueryable()
            .Where(b => b.Status == BusinessStatus.Active
                && b.DiscountPercentage != null && b.DiscountPercentage > 0
                && (!b.DiscountStartDate.HasValue || b.DiscountStartDate <= now)
                && (!b.DiscountEndDate.HasValue || b.DiscountEndDate > now))
            .OrderByDescending(b => b.DiscountPercentage)
            .ThenByDescending(b => b.IsFeatured)
            .ThenByDescending(b => b.IsVerified)
            .Take(count)
            .Select(b => new BusinessSummaryDto(
                b.Id, b.Slug,
                new MultilingualTextDto(b.Name.Ku, b.Name.Kmr, b.Name.De, b.Name.En),
                b.CategoryId, null,
                b.Address.Street, b.Address.PostalCode,
                b.Location.Latitude, b.Location.Longitude,
                b.Phone, b.Status, b.IsVerified, b.IsFeatured,
                b.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? b.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                b.DiscountPercentage,
                b.DiscountDescription != null
                    ? new MultilingualTextDto(b.DiscountDescription.Ku, b.DiscountDescription.Kmr, b.DiscountDescription.De, b.DiscountDescription.En)
                    : null,
                true))
            .ToListAsync(ct);

        var result = new RecommendedBusinessesDto(featured, discounted);

        await cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(CacheTtlMinutes), ct);

        return result;
    }
}
