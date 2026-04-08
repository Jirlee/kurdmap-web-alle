using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.GetBusinessBySlug;

public sealed class GetBusinessBySlugQueryHandler(
    IBusinessRepository businessRepository) : IRequestHandler<GetBusinessBySlugQuery, Result<BusinessDetailDto>>
{
    public async Task<Result<BusinessDetailDto>> Handle(GetBusinessBySlugQuery request, CancellationToken ct)
    {
        var business = await businessRepository.GetBySlugAsync(request.Slug, ct);
        if (business is null)
            return Result<BusinessDetailDto>.Failure($"Business with slug '{request.Slug}' not found.");

        return business.ToDetailDto();
    }
}
