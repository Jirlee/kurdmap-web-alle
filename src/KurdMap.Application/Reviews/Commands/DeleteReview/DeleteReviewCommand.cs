using KurdMap.Application.Common.Models;
using KurdMap.Domain.Common;
using KurdMap.Domain.Reviews;
using MediatR;

namespace KurdMap.Application.Reviews.Commands.DeleteReview;

public sealed record DeleteReviewCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteReviewCommandHandler(
    IReviewRepository reviewRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteReviewCommand, Result>
{
    public async Task<Result> Handle(DeleteReviewCommand request, CancellationToken ct)
    {
        var review = await reviewRepository.GetByIdAsync(request.Id, ct);
        if (review is null)
            return Result.Failure($"Review with ID '{request.Id}' not found.");

        reviewRepository.Remove(review);
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
