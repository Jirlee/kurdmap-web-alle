using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.DeleteBusinessService;

public sealed record DeleteBusinessServiceCommand(
    Guid BusinessId,
    Guid ServiceId) : IRequest<Result>;

public sealed class DeleteBusinessServiceCommandHandler(
    IBusinessRepository businessRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteBusinessServiceCommand, Result>
{
    public async Task<Result> Handle(DeleteBusinessServiceCommand request, CancellationToken ct)
    {
        var business = await businessRepository.GetByIdAsync(request.BusinessId, ct);
        if (business is null)
            return Result.Failure($"Business with ID '{request.BusinessId}' not found.");

        var service = business.Services.FirstOrDefault(s => s.Id == request.ServiceId);
        if (service is null)
            return Result.Failure($"Service with ID '{request.ServiceId}' not found.");

        business.RemoveService(service);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
