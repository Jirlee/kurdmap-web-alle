using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.CreateBusinessService;

public sealed record CreateBusinessServiceCommand(
    Guid BusinessId,
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    int SortOrder) : IRequest<Result<BusinessServiceDto>>;

public sealed class CreateBusinessServiceCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateBusinessServiceCommand, Result<BusinessServiceDto>>
{
    public async Task<Result<BusinessServiceDto>> Handle(CreateBusinessServiceCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result<BusinessServiceDto>.Failure($"Business with ID '{request.BusinessId}' not found.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var description = request.Description is not null
            ? MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "")
            : null;

        var service = BusinessService.Create(
            request.BusinessId, name, description,
            request.Price, request.SortOrder);

        business.AddService(service);
        await unitOfWork.SaveChangesAsync(ct);

        return service.ToDto();
    }
}
