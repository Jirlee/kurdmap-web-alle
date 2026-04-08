using KurdMap.Application.Common.Models;
using KurdMap.Application.Reviews.DTOs;
using KurdMap.Domain.Reviews;
using MediatR;

namespace KurdMap.Application.Reviews.Queries.GetAllReviews;

public sealed record GetAllReviewsQuery(bool? ApprovedOnly) : IRequest<Result<List<ReviewDto>>>;

public sealed class GetAllReviewsQueryHandler(
    IReviewRepository reviewRepository) : IRequestHandler<GetAllReviewsQuery, Result<List<ReviewDto>>>
{
    public async Task<Result<List<ReviewDto>>> Handle(GetAllReviewsQuery request, CancellationToken ct)
    {
        var reviews = await reviewRepository.GetAllAsync(request.ApprovedOnly, ct);
        var dtos = reviews.Select(r => new ReviewDto(
            r.Id, r.BusinessId, r.UserId, null,
            r.Rating, r.Comment, r.IsApproved, r.CreatedAt)).ToList();
        return Result<List<ReviewDto>>.Success(dtos);
    }
}
