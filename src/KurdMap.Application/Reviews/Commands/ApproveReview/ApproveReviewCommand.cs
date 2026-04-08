using KurdMap.Application.Common.Models;
using KurdMap.Domain.Common;
using KurdMap.Domain.Reviews;
using MediatR;

namespace KurdMap.Application.Reviews.Commands.ApproveReview;

public sealed record ApproveReviewCommand(Guid Id) : IRequest<Result>;

public sealed class ApproveReviewCommandHandler(
    IReviewRepository reviewRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<ApproveReviewCommand, Result>
{
    public async Task<Result> Handle(ApproveReviewCommand request, CancellationToken ct)
    {
        var review = await reviewRepository.GetByIdAsync(request.Id, ct);
        if (review is null)
            return Result.Failure($"Review with ID '{request.Id}' not found.");

        review.Approve();
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
