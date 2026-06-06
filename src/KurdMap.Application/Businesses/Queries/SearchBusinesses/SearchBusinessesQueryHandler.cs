using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Enums;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.SearchBusinesses;

public sealed class SearchBusinessesQueryHandler(
    IBusinessRepository businessRepository,
    ICategoryRepository categoryRepository,
    ICityRepository cityRepository,
    ICacheService cacheService) : IRequestHandler<SearchBusinessesQuery, Result<PaginatedList<BusinessSummaryDto>>>
{
    private const int CacheTtlMinutes = 5;
    private const double EarthRadiusKm = 6371.0;
    private const double DefaultRadiusKm = 10.0;

    public async Task<Result<PaginatedList<BusinessSummaryDto>>> Handle(
        SearchBusinessesQuery request, CancellationToken ct)
    {
        // Try cache first
        var cacheKey = BuildCacheKey(request);
        var cached = await cacheService.GetAsync<PaginatedList<BusinessSummaryDto>>(cacheKey, ct);
        if (cached is not null)
            return cached;

        // Resolve slug-based filters to IDs
        Guid? categoryId = null;
        string? categorySlug = null;
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var category = await categoryRepository.GetBySlugAsync(request.Category, ct);
            if (category is null)
                return Result<PaginatedList<BusinessSummaryDto>>.Failure($"Category '{request.Category}' not found.");
            categoryId = category.Id;
            categorySlug = category.Slug;
        }

        Guid? cityId = null;
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = await cityRepository.GetBySlugAsync(request.City, ct);
            if (city is null)
                return Result<PaginatedList<BusinessSummaryDto>>.Failure($"City '{request.City}' not found.");
            cityId = city.Id;
        }

        var query = businessRepository.GetQueryable()
            .Where(b => b.Status == BusinessStatus.Active);

        // Filter by category
        if (categoryId.HasValue)
            query = query.Where(b => b.CategoryId == categoryId.Value);

        // Filter by city
        if (cityId.HasValue)
            query = query.Where(b => b.Address.CityId == cityId.Value);

        // Full-text search
        var hasSearch = !string.IsNullOrWhiteSpace(request.Search);
        if (hasSearch)
            query = businessRepository.ApplyFullTextSearch(query, request.Search!.Trim());

        // Geo-filter by radius (Haversine bounding box pre-filter for performance)
        var hasLocation = request.Latitude.HasValue && request.Longitude.HasValue;
        if (hasLocation)
        {
            var lat = request.Latitude!.Value;
            var lng = request.Longitude!.Value;
            var radius = Math.Clamp(request.RadiusKm ?? DefaultRadiusKm, 0.5, 100.0);

            // Bounding box pre-filter (fast, uses index)
            var latDelta = radius / 111.0;
            var lngDelta = radius / (111.0 * Math.Cos(lat * Math.PI / 180.0));
            var minLat = (decimal)(lat - latDelta);
            var maxLat = (decimal)(lat + latDelta);
            var minLng = (decimal)(lng - lngDelta);
            var maxLng = (decimal)(lng + lngDelta);

            query = query.Where(b =>
                b.Location.Latitude >= minLat && b.Location.Latitude <= maxLat &&
                b.Location.Longitude >= minLng && b.Location.Longitude <= maxLng);
        }

        // Sorting
        query = ApplySort(query, request.Sort, hasSearch ? request.Search!.Trim() : null,
            hasLocation ? request.Latitude : null, hasLocation ? request.Longitude : null);

        // Project to DTO and paginate
        var now = DateTime.UtcNow;
        var projected = query.Select(b => new BusinessSummaryDto(
            b.Id,
            b.Slug,
            new MultilingualTextDto(b.Name.Ku, b.Name.Kmr, b.Name.De, b.Name.En),
            b.CategoryId,
            categorySlug,
            b.Address.Street,
            b.Address.PostalCode,
            b.Location.Latitude,
            b.Location.Longitude,
            b.Phone,
            b.Status,
            b.IsVerified,
            b.IsFeatured,
            b.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                ?? b.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            b.DiscountPercentage,
            b.DiscountDescription != null
                ? new MultilingualTextDto(b.DiscountDescription.Ku, b.DiscountDescription.Kmr, b.DiscountDescription.De, b.DiscountDescription.En)
                : null,
            b.DiscountPercentage.HasValue && b.DiscountPercentage > 0
                && (!b.DiscountStartDate.HasValue || b.DiscountStartDate <= now)
                && (!b.DiscountEndDate.HasValue || b.DiscountEndDate > now)));

        var result = await PaginatedList<BusinessSummaryDto>.CreateAsync(
            projected, request.Page, request.PageSize, ct);

        // Annotate each result on the current page with its real Haversine distance
        // (km) from the user. Done in-memory on the page (max PageSize items) so it
        // never affects the SQL query, and only when a location was supplied.
        if (hasLocation)
        {
            var lat = request.Latitude!.Value;
            var lng = request.Longitude!.Value;
            for (var i = 0; i < result.Items.Count; i++)
            {
                var dto = result.Items[i];
                var km = HaversineKm(lat, lng, (double)dto.Latitude, (double)dto.Longitude);
                result.Items[i] = dto with { DistanceKm = Math.Round(km, 2) };
            }
        }

        // Cache result
        await cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(CacheTtlMinutes), ct);

        return result;
    }

    /// <summary>Great-circle distance in kilometers between two coordinates.</summary>
    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return EarthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private IQueryable<Domain.Businesses.Entities.Business> ApplySort(
        IQueryable<Domain.Businesses.Entities.Business> query,
        BusinessSortOption sort,
        string? searchTerm,
        double? latitude,
        double? longitude)
    {
        return sort switch
        {
            BusinessSortOption.NearestFirst when latitude.HasValue && longitude.HasValue =>
                query.OrderBy(b =>
                    Math.Sqrt(
                        Math.Pow((double)(b.Location.Latitude) - latitude.Value, 2) +
                        Math.Pow(((double)(b.Location.Longitude) - longitude.Value) *
                            Math.Cos(latitude.Value * Math.PI / 180.0), 2)))
                    .ThenByDescending(b => b.IsVerified),

            BusinessSortOption.Relevance when searchTerm is not null =>
                businessRepository.OrderBySearchRelevance(query, searchTerm)
                    .ThenByDescending(b => b.IsVerified),

            BusinessSortOption.Name =>
                query.OrderBy(b => b.Name.De).ThenBy(b => b.Name.Ku),

            BusinessSortOption.Newest =>
                query.OrderByDescending(b => b.CreatedAt),

            BusinessSortOption.VerifiedFirst =>
                query.OrderByDescending(b => b.IsVerified).ThenByDescending(b => b.CreatedAt),

            BusinessSortOption.FeaturedFirst =>
                query.OrderByDescending(b => b.IsFeatured).ThenByDescending(b => b.IsVerified).ThenByDescending(b => b.CreatedAt),

            // Default: featured/discounted first, then verified, then newest
            _ => query
                .OrderByDescending(b => b.IsFeatured)
                .ThenByDescending(b => b.DiscountPercentage.HasValue && b.DiscountPercentage > 0
                    && (!b.DiscountStartDate.HasValue || b.DiscountStartDate <= DateTime.UtcNow)
                    && (!b.DiscountEndDate.HasValue || b.DiscountEndDate > DateTime.UtcNow))
                .ThenByDescending(b => b.IsVerified)
                .ThenByDescending(b => b.CreatedAt)
        };
    }

    private static string BuildCacheKey(SearchBusinessesQuery request)
        => $"search:businesses:{request.Search ?? ""}:{request.City ?? ""}:{request.Category ?? ""}:{request.Page}:{request.PageSize}:{(int)request.Sort}:{request.Latitude?.ToString("F4") ?? ""}:{request.Longitude?.ToString("F4") ?? ""}:{request.RadiusKm?.ToString("F1") ?? ""}";
}
