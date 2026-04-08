using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.DeleteBusiness;

public sealed class DeleteBusinessCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteBusinessCommand, Result>
{
    public async Task<Result> Handle(DeleteBusinessCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.Id, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.Id}' not found.");

        business.SoftDelete();

        businessRepository.Update(business);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
