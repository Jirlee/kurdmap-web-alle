using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Cities.Commands.DeleteCity;

public sealed record DeleteCityCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteCityCommandHandler(
    ICityRepository cityRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCityCommand, Result>
{
    public async Task<Result> Handle(DeleteCityCommand request, CancellationToken ct)
    {
        var city = await cityRepository.GetByIdAsync(request.Id, ct);
        if (city is null)
            return Result.Failure($"City with ID '{request.Id}' not found.");

        cityRepository.Remove(city);
        await unitOfWork.SaveChangesAsync(ct);

        await cacheService.RemoveAsync("cities:all", ct);

        return Result.Success();
    }
}
