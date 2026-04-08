using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.VerifyBusiness;

public sealed class VerifyBusinessCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<VerifyBusinessCommand, Result>
{
    public async Task<Result> Handle(VerifyBusinessCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.Id, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.Id}' not found.");

        business.Verify();

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
