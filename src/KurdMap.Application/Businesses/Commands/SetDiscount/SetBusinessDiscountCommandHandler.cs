using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.SetDiscount;

public sealed class SetBusinessDiscountCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<SetBusinessDiscountCommand, Result>
{
    public async Task<Result> Handle(SetBusinessDiscountCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.Id, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.Id}' not found.");

        MultilingualText? description = request.Description is not null
            ? MultilingualText.Create(
                request.Description.Ku,
                request.Description.De,
                request.Description.Kmr ?? "",
                request.Description.En ?? "")
            : null;

        business.SetDiscount(request.Percentage, description, request.StartDate, request.EndDate);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
