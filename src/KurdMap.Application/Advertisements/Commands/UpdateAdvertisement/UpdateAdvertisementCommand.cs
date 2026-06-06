using KurdMap.Application.Advertisements.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Advertisements;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Advertisements.Commands.UpdateAdvertisement;

public sealed record UpdateAdvertisementCommand(
    Guid Id,
    MultilingualTextDto Title,
    MultilingualTextDto? Description,
    string ImageUrl,
    string? LinkUrl,
    DateTime StartDate,
    DateTime EndDate,
    int SortOrder) : IRequest<Result<AdvertisementDto>>;

public sealed class UpdateAdvertisementCommandHandler(
    IAdvertisementRepository advertisementRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateAdvertisementCommand, Result<AdvertisementDto>>
{
    public async Task<Result<AdvertisementDto>> Handle(UpdateAdvertisementCommand request, CancellationToken ct)
    {
        var ad = await advertisementRepository.GetByIdAsync(request.Id, ct);
        if (ad is null)
            return Result<AdvertisementDto>.Failure($"Advertisement with ID '{request.Id}' not found.");

        var title = MultilingualText.Create(request.Title.Ku, request.Title.De, request.Title.Kmr ?? "", request.Title.En ?? "");

        MultilingualText? description = null;
        if (request.Description is not null)
            description = MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "");

        ad.Update(title, description, request.ImageUrl, request.LinkUrl,
            request.StartDate, request.EndDate, request.SortOrder);

        advertisementRepository.Update(ad);
        await unitOfWork.SaveChangesAsync(ct);
        await cacheService.RemoveByPrefixAsync("advertisements:", ct);

        return new AdvertisementDto(
            ad.Id,
            ad.Title.Ku, ad.Title.Kmr, ad.Title.De, ad.Title.En,
            ad.Description?.Ku, ad.Description?.De,
            ad.ImageUrl, ad.LinkUrl, ad.BusinessId,
            ad.StartDate, ad.EndDate, ad.IsActive, ad.SortOrder);
    }
}
