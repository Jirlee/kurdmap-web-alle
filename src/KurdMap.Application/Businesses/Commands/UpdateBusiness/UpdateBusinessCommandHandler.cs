using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.UpdateBusiness;

public sealed class UpdateBusinessCommandHandler(
    IBusinessRepository businessRepository,
    ICategoryRepository categoryRepository,
    ICityRepository cityRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateBusinessCommand, Result<BusinessDetailDto>>
{
    public async Task<Result<BusinessDetailDto>> Handle(UpdateBusinessCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.Id, ct);
        if (business is null)
            return Result<BusinessDetailDto>.Failure($"Business with ID '{request.Id}' not found.");

        var category = await categoryRepository.GetByIdAsync(request.CategoryId, ct);
        if (category is null)
            return Result<BusinessDetailDto>.Failure($"Category with ID '{request.CategoryId}' not found.");

        var city = await cityRepository.GetByIdAsync(request.CityId, ct);
        if (city is null)
            return Result<BusinessDetailDto>.Failure($"City with ID '{request.CityId}' not found.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var description = MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "");
        var address = Address.Create(request.Street, request.PostalCode, request.CityId);
        var location = Coordinates.Create(request.Latitude, request.Longitude);

        business.Update(name, description, request.CategoryId, address, location);
        business.SetContact(request.Phone, request.Email, request.Website);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return business.ToDetailDto();
    }
}
