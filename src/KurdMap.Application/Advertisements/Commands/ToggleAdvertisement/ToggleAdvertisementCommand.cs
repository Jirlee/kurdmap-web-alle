using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Advertisements;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Advertisements.Commands.ToggleAdvertisement;

public sealed record ToggleAdvertisementCommand(Guid Id, bool IsActive) : IRequest<Result>;

public sealed class ToggleAdvertisementCommandHandler(
    IAdvertisementRepository advertisementRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<ToggleAdvertisementCommand, Result>
{
    public async Task<Result> Handle(ToggleAdvertisementCommand request, CancellationToken ct)
    {
        var ad = await advertisementRepository.GetByIdAsync(request.Id, ct);
        if (ad is null)
            return Result.Failure($"Advertisement with ID '{request.Id}' not found.");

        if (request.IsActive) ad.Activate(); else ad.Deactivate();

        advertisementRepository.Update(ad);
        await unitOfWork.SaveChangesAsync(ct);
        await cacheService.RemoveByPrefixAsync("advertisements:", ct);

        return Result.Success();
    }
}
