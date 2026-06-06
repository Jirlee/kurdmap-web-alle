using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Advertisements;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Advertisements.Commands.DeleteAdvertisement;

public sealed record DeleteAdvertisementCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteAdvertisementCommandHandler(
    IAdvertisementRepository advertisementRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteAdvertisementCommand, Result>
{
    public async Task<Result> Handle(DeleteAdvertisementCommand request, CancellationToken ct)
    {
        var ad = await advertisementRepository.GetByIdAsync(request.Id, ct);
        if (ad is null)
            return Result.Failure($"Advertisement with ID '{request.Id}' not found.");

        advertisementRepository.Remove(ad);
        await unitOfWork.SaveChangesAsync(ct);
        await cacheService.RemoveByPrefixAsync("advertisements:", ct);

        return Result.Success();
    }
}
