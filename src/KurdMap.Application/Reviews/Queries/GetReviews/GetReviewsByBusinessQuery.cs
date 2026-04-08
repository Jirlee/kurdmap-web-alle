using KurdMap.Application.Common.Models;
using KurdMap.Application.Reviews.DTOs;
using KurdMap.Domain.Reviews;
using MediatR;

namespace KurdMap.Application.Reviews.Queries.GetReviews;

public sealed record GetReviewsByBusinessQuery(Guid BusinessId) : IRequest<Result<List<ReviewDto>>>;

public sealed class GetReviewsByBusinessQueryHandler(
    IReviewRepository reviewRepository) : IRequestHandler<GetReviewsByBusinessQuery, Result<List<ReviewDto>>>
{
    public async Task<Result<List<ReviewDto>>> Handle(GetReviewsByBusinessQuery request, CancellationToken ct)
    {
        var reviews = await reviewRepository.GetByBusinessIdAsync(request.BusinessId, ct);
        var dtos = reviews.Select(r => new ReviewDto(
            r.Id, r.BusinessId, r.UserId, null,
            r.Rating, r.Comment, r.IsApproved, r.CreatedAt)).ToList();
        return Result<List<ReviewDto>>.Success(dtos);
    }
}
