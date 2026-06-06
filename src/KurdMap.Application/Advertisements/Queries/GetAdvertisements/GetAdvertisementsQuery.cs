using KurdMap.Application.Advertisements.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Advertisements;
using MediatR;

namespace KurdMap.Application.Advertisements.Queries.GetAdvertisements;

public sealed record GetAdvertisementsQuery(bool ActiveOnly = false) : IRequest<Result<List<AdvertisementDto>>>;

public sealed class GetAdvertisementsQueryHandler(
    IAdvertisementRepository advertisementRepository,
    ICacheService cacheService) : IRequestHandler<GetAdvertisementsQuery, Result<List<AdvertisementDto>>>
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    public async Task<Result<List<AdvertisementDto>>> Handle(GetAdvertisementsQuery request, CancellationToken ct)
    {
        var cacheKey = request.ActiveOnly ? "advertisements:active" : "advertisements:all";

        var cached = await cacheService.GetAsync<List<AdvertisementDto>>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var ads = request.ActiveOnly
            ? await advertisementRepository.GetActiveAsync(ct)
            : await advertisementRepository.GetAllAsync(ct);

        var dtos = ads.Select(a => new AdvertisementDto(
            a.Id,
            a.Title.Ku, a.Title.Kmr, a.Title.De, a.Title.En,
            a.Description?.Ku, a.Description?.De,
            a.ImageUrl, a.LinkUrl, a.BusinessId,
            a.StartDate, a.EndDate, a.IsActive, a.SortOrder)).ToList();

        await cacheService.SetAsync(cacheKey, dtos, CacheTtl, ct);

        return dtos;
    }
}
