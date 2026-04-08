using KurdMap.Application.Cities.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Cities;
using MediatR;

namespace KurdMap.Application.Cities.Queries.GetCities;

public sealed record GetCitiesQuery : IRequest<Result<List<CityDto>>>;

public sealed class GetCitiesQueryHandler(
    ICityRepository cityRepository,
    ICacheService cacheService) : IRequestHandler<GetCitiesQuery, Result<List<CityDto>>>
{
    private const string CacheKey = "cities:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    public async Task<Result<List<CityDto>>> Handle(GetCitiesQuery request, CancellationToken ct)
    {
        var cached = await cacheService.GetAsync<List<CityDto>>(CacheKey, ct);
        if (cached is not null)
            return cached;

        var cities = await cityRepository.GetAllAsync(ct);

        var dtos = cities.Select(c => new CityDto(
            c.Id,
            c.Slug,
            c.Name.Ku,
            c.Name.Kmr,
            c.Name.De,
            c.Name.En,
            c.Latitude,
            c.Longitude)).ToList();

        await cacheService.SetAsync(CacheKey, dtos, CacheTtl, ct);

        return dtos;
    }
}
