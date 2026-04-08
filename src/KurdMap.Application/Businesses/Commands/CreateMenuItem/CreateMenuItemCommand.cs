using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.CreateMenuItem;

public sealed record CreateMenuItemCommand(
    Guid BusinessId,
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    string? ImageUrl,
    int SortOrder) : IRequest<Result<MenuItemDto>>;

public sealed class CreateMenuItemCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateMenuItemCommand, Result<MenuItemDto>>
{
    public async Task<Result<MenuItemDto>> Handle(CreateMenuItemCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result<MenuItemDto>.Failure($"Business with ID '{request.BusinessId}' not found.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var description = request.Description is not null
            ? MultilingualText.Create(request.Description.Ku, request.Description.De, request.Description.Kmr ?? "", request.Description.En ?? "")
            : null;

        var menuItem = MenuItem.Create(
            request.BusinessId, name, description,
            request.Price, request.ImageUrl, request.SortOrder);

        business.AddMenuItem(menuItem);
        await unitOfWork.SaveChangesAsync(ct);

        return menuItem.ToDto();
    }
}
