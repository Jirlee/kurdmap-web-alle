using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Cities.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Cities.Commands.UpdateCity;

public sealed record UpdateCityCommand(
    Guid Id,
    MultilingualTextDto Name,
    decimal Latitude,
    decimal Longitude) : IRequest<Result<CityDto>>;

public sealed class UpdateCityCommandHandler(
    ICityRepository cityRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateCityCommand, Result<CityDto>>
{
    public async Task<Result<CityDto>> Handle(UpdateCityCommand request, CancellationToken ct)
    {
        var city = await cityRepository.GetByIdAsync(request.Id, ct);
        if (city is null)
            return Result<CityDto>.Failure($"City with ID '{request.Id}' not found.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        city.Update(name, request.Latitude, request.Longitude);

        cityRepository.Update(city);
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
