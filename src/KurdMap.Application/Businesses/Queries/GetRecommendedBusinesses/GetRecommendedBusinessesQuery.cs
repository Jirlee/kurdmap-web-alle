using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.GetRecommendedBusinesses;

public sealed record GetRecommendedBusinessesQuery(
    int Count = 12) : IRequest<Result<RecommendedBusinessesDto>>;

public sealed record RecommendedBusinessesDto(
    List<BusinessSummaryDto> Featured,
    List<BusinessSummaryDto> Discounted);
