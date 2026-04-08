using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.SearchBusinesses;

public enum BusinessSortOption
{
    Relevance = 0,
    Name = 1,
    Newest = 2,
    VerifiedFirst = 3,
    NearestFirst = 4,
    FeaturedFirst = 5
}

public sealed record SearchBusinessesQuery(
    string? Search = null,
    string? City = null,
    string? Category = null,
    int Page = 1,
    int PageSize = 10,
    BusinessSortOption Sort = BusinessSortOption.Relevance,
    double? Latitude = null,
    double? Longitude = null,
    double? RadiusKm = null) : IRequest<Result<PaginatedList<BusinessSummaryDto>>>;
