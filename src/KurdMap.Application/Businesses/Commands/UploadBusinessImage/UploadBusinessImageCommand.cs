using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.UploadBusinessImage;

public sealed record UploadBusinessImageCommand(
    Guid BusinessId,
    Stream ImageStream,
    string FileName,
    long FileSize,
    string? AltText,
    bool IsPrimary) : IRequest<Result<BusinessImageDto>>;

public sealed class UploadBusinessImageCommandHandler(
    IBusinessRepository businessRepository,
    IImageService imageService,
    IUnitOfWork unitOfWork) : IRequestHandler<UploadBusinessImageCommand, Result<BusinessImageDto>>
{
    public async Task<Result<BusinessImageDto>> Handle(UploadBusinessImageCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result<BusinessImageDto>.Failure($"Business with ID '{request.BusinessId}' not found.");

        imageService.ValidateImage(request.ImageStream, request.FileName, request.FileSize);

        var url = await imageService.SaveOptimizedImageAsync(request.ImageStream, request.FileName, ct);

        business.AddImage(url, request.AltText, request.IsPrimary);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        var image = business.Images.Last();
        return new BusinessImageDto(image.Id, image.Url, image.AltText, image.IsPrimary, image.SortOrder);
    }
}
