using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Enums;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.GetBusinessesList;

public sealed record GetBusinessesListQuery(
    int PageNumber = 1,
    int PageSize = 10,
    Guid? CategoryId = null,
    Guid? CityId = null,
    BusinessStatus? Status = null,
    string? SearchTerm = null) : IRequest<Result<PaginatedList<BusinessSummaryDto>>>;
