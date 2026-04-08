using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.SetPrimaryImage;

public sealed record SetPrimaryImageCommand(
    Guid BusinessId,
    Guid ImageId) : IRequest<Result>;

public sealed class SetPrimaryImageCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<SetPrimaryImageCommand, Result>
{
    public async Task<Result> Handle(SetPrimaryImageCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.BusinessId}' not found.");

        var image = business.Images.FirstOrDefault(i => i.Id == request.ImageId);
        if (image is null)
            return Result.Failure($"Image with ID '{request.ImageId}' not found.");

        business.SetPrimaryImage(request.ImageId);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
