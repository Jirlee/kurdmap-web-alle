using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.DeleteBusinessImage;

public sealed record DeleteBusinessImageCommand(
    Guid BusinessId,
    Guid ImageId) : IRequest<Result>;

public sealed class DeleteBusinessImageCommandHandler(
    IBusinessRepository businessRepository,
    IImageService imageService,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteBusinessImageCommand, Result>
{
    public async Task<Result> Handle(DeleteBusinessImageCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.BusinessId}' not found.");

        var image = business.Images.FirstOrDefault(i => i.Id == request.ImageId);
        if (image is null)
            return Result.Failure($"Image with ID '{request.ImageId}' not found.");

        await imageService.DeleteImageAsync(image.Url, ct);

        business.RemoveImage(request.ImageId);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
