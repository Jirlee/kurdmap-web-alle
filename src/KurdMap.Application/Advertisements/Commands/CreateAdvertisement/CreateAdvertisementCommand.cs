using KurdMap.Application.Advertisements.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Advertisements;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Advertisements.Commands.CreateAdvertisement;

public sealed record CreateAdvertisementCommand(
    MultilingualTextDto Title,
    MultilingualTextDto? Description,
    string ImageUrl,
    string? LinkUrl,
    Guid? BusinessId,
    DateTime StartDate,
    DateTime EndDate,
    int SortOrder) : IRequest<Result<AdvertisementDto>>;

public sealed class CreateAdvertisementCommandHandler(
    IAdvertisementRepository advertisementRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateAdvertisementCommand, Result<AdvertisementDto>>
{
    public async Task<Result<AdvertisementDto>> Handle(CreateAdvertisementCommand request, CancellationToken ct)
    {
        var title = MultilingualText.Create(request.Title.Ku, request.Title.De, request.Title.Kmr ?? "", request.Title.En ?? "");

        MultilingualText? description = null;
        if (request.Description is not null)
            description = MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "");

        var ad = Domain.Advertisements.Entities.Advertisement.Create(
            title, description, request.ImageUrl, request.LinkUrl,
            request.BusinessId, request.StartDate, request.EndDate, request.SortOrder);

        await advertisementRepository.AddAsync(ad, ct);
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
