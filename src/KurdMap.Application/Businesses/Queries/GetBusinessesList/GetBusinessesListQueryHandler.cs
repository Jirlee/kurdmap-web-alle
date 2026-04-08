using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Application.Businesses.Queries.GetBusinessesList;

public sealed class GetBusinessesListQueryHandler(
    IBusinessRepository businessRepository) : IRequestHandler<GetBusinessesListQuery, Result<PaginatedList<BusinessSummaryDto>>>
{
    public async Task<Result<PaginatedList<BusinessSummaryDto>>> Handle(
        GetBusinessesListQuery request, CancellationToken ct)
    {
        var query = businessRepository.GetQueryable();

        // Apply filters
        if (request.CategoryId.HasValue)
            query = query.Where(b => b.CategoryId == request.CategoryId.Value);

        if (request.CityId.HasValue)
            query = query.Where(b => b.Address.CityId == request.CityId.Value);

        if (request.Status.HasValue)
            query = query.Where(b => b.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLowerInvariant();
            query = query.Where(b =>
                b.Name.Ku.ToLower().Contains(term) ||
                b.Name.De.ToLower().Contains(term) ||
                (b.Name.Kmr != null && b.Name.Kmr.ToLower().Contains(term)) ||
                (b.Name.En != null && b.Name.En.ToLower().Contains(term)));
        }

        // Order by newest first
        query = query.OrderByDescending(b => b.CreatedAt);

        // Paginate at DB level, then project
        var now = DateTime.UtcNow;
        var paginatedBusinesses = await PaginatedList<BusinessSummaryDto>.CreateAsync(
            query.Select(b => new BusinessSummaryDto(
                b.Id,
                b.Slug,
                new MultilingualTextDto(b.Name.Ku, b.Name.Kmr, b.Name.De, b.Name.En),
                b.CategoryId,
                null,
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
                    && (!b.DiscountEndDate.HasValue || b.DiscountEndDate > now))),
            request.PageNumber,
            request.PageSize,
            ct);

        return paginatedBusinesses;
    }
}
