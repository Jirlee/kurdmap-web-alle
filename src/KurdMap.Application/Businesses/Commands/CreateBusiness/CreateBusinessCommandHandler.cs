using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.CreateBusiness;

public sealed class CreateBusinessCommandHandler(
    IBusinessRepository businessRepository,
    ICategoryRepository categoryRepository,
    ICityRepository cityRepository,
    ISlugService slugService,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateBusinessCommand, Result<BusinessDetailDto>>
{
    public async Task<Result<BusinessDetailDto>> Handle(CreateBusinessCommand request, CancellationToken ct)
    {
        // Validate category exists
        var category = await categoryRepository.GetByIdAsync(request.CategoryId, ct);
        if (category is null)
            return Result<BusinessDetailDto>.Failure($"Category with ID '{request.CategoryId}' not found.");

        // Validate city exists
        var city = await cityRepository.GetByIdAsync(request.CityId, ct);
        if (city is null)
            return Result<BusinessDetailDto>.Failure($"City with ID '{request.CityId}' not found.");

        // Generate unique slug from German name
        var slug = await slugService.GenerateUniqueSlugAsync(request.Name.De, ct);

        // Build value objects
        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var description = MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "");
        var address = Address.Create(request.Street, request.PostalCode, request.CityId);
        var location = Coordinates.Create(request.Latitude, request.Longitude);

        // Create aggregate
        var business = Business.Create(name, slug, description, request.CategoryId, address, location);

        // Set optional contact info
        if (request.Phone is not null || request.Email is not null || request.Website is not null)
            business.SetContact(request.Phone, request.Email, request.Website);

        await businessRepository.AddAsync(business, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return business.ToDetailDto();
    }
}
