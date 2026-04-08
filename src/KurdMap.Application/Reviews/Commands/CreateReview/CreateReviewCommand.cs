using KurdMap.Application.Common.Models;
using KurdMap.Application.Reviews.DTOs;
using KurdMap.Domain.Common;
using KurdMap.Domain.Reviews;
using KurdMap.Domain.Reviews.Entities;
using MediatR;

namespace KurdMap.Application.Reviews.Commands.CreateReview;

public sealed record CreateReviewCommand(
    Guid BusinessId,
    Guid UserId,
    int Rating,
    string? Comment) : IRequest<Result<ReviewDto>>;

public sealed class CreateReviewCommandHandler(
    IReviewRepository reviewRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateReviewCommand, Result<ReviewDto>>
{
    public async Task<Result<ReviewDto>> Handle(CreateReviewCommand request, CancellationToken ct)
    {
        var exists = await reviewRepository.ExistsAsync(request.BusinessId, request.UserId, ct);
        if (exists)
            return Result<ReviewDto>.Failure("You have already reviewed this business.");

        var review = Review.Create(request.BusinessId, request.UserId, request.Rating, request.Comment);

        await reviewRepository.AddAsync(review, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new ReviewDto(
            review.Id, review.BusinessId, review.UserId, null,
            review.Rating, review.Comment, review.IsApproved, review.CreatedAt);
    }
}
