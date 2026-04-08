using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.DeleteMenuItem;

public sealed record DeleteMenuItemCommand(
    Guid BusinessId,
    Guid MenuItemId) : IRequest<Result>;

public sealed class DeleteMenuItemCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteMenuItemCommand, Result>
{
    public async Task<Result> Handle(DeleteMenuItemCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.BusinessId}' not found.");

        var menuItem = business.MenuItems.FirstOrDefault(m => m.Id == request.MenuItemId);
        if (menuItem is null)
            return Result.Failure($"Menu item with ID '{request.MenuItemId}' not found.");

        business.RemoveMenuItem(menuItem);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
