using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Cities.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Cities.Entities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Cities.Commands.CreateCity;

public sealed record CreateCityCommand(
    MultilingualTextDto Name,
    string Slug,
    decimal Latitude,
    decimal Longitude) : IRequest<Result<CityDto>>;

public sealed class CreateCityCommandHandler(
    ICityRepository cityRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateCityCommand, Result<CityDto>>
{
    public async Task<Result<CityDto>> Handle(CreateCityCommand request, CancellationToken ct)
    {
        var existing = await cityRepository.GetBySlugAsync(request.Slug, ct);
        if (existing is not null)
            return Result<CityDto>.Failure($"City with slug '{request.Slug}' already exists.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var city = City.Create(name, request.Slug, request.Latitude, request.Longitude);

        await cityRepository.AddAsync(city, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await cacheService.RemoveAsync("cities:all", ct);

        return new CityDto(
            city.Id,
            city.Slug,
            city.Name.Ku,
            city.Name.Kmr,
            city.Name.De,
            city.Name.En,
            city.Latitude,
            city.Longitude);
    }
}
