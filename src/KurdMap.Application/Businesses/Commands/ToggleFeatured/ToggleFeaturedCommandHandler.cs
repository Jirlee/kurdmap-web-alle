using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.ToggleFeatured;

public sealed class ToggleFeaturedCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<ToggleFeaturedCommand, Result>
{
    public async Task<Result> Handle(ToggleFeaturedCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.Id, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.Id}' not found.");

        business.SetFeatured(!business.IsFeatured);

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
