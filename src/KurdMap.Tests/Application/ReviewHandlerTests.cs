using KurdMap.Application.Reviews.Commands.CreateReview;
using KurdMap.Application.Reviews.Commands.ApproveReview;
using KurdMap.Application.Reviews.Commands.DeleteReview;
using KurdMap.Application.Reviews.Queries.GetReviews;
using KurdMap.Application.Reviews.Queries.GetAllReviews;
using KurdMap.Domain.Common;
using KurdMap.Domain.Reviews;
using KurdMap.Domain.Reviews.Entities;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class ReviewHandlerTests
{
    private readonly IReviewRepository _reviewRepo = Substitute.For<IReviewRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateReview_WhenNotExists_ShouldSucceed()
    {
        _reviewRepo.ExistsAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new CreateReviewCommandHandler(_reviewRepo, _unitOfWork);
        var command = new CreateReviewCommand(Guid.NewGuid(), Guid.NewGuid(), 4, "Good!");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(4, result.Value!.Rating);
        Assert.Equal("Good!", result.Value.Comment);
        await _reviewRepo.Received(1).AddAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateReview_WhenAlreadyExists_ShouldFail()
    {
        _reviewRepo.ExistsAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CreateReviewCommandHandler(_reviewRepo, _unitOfWork);
        var command = new CreateReviewCommand(Guid.NewGuid(), Guid.NewGuid(), 5, "Duplicate");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("already reviewed", result.Error!);
    }

    [Fact]
    public async Task ApproveReview_WhenExists_ShouldSucceed()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 3, "OK");
        _reviewRepo.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var handler = new ApproveReviewCommandHandler(_reviewRepo, _unitOfWork);
        var result = await handler.Handle(new ApproveReviewCommand(review.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(review.IsApproved);
    }

    [Fact]
    public async Task ApproveReview_WhenNotFound_ShouldFail()
    {
        _reviewRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        var handler = new ApproveReviewCommandHandler(_reviewRepo, _unitOfWork);
        var result = await handler.Handle(new ApproveReviewCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task DeleteReview_WhenExists_ShouldSucceed()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 2, "Bad");
        _reviewRepo.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var handler = new DeleteReviewCommandHandler(_reviewRepo, _unitOfWork);
        var result = await handler.Handle(new DeleteReviewCommand(review.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _reviewRepo.Received(1).Remove(review);
    }

    [Fact]
    public async Task DeleteReview_WhenNotFound_ShouldFail()
    {
        _reviewRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        var handler = new DeleteReviewCommandHandler(_reviewRepo, _unitOfWork);
        var result = await handler.Handle(new DeleteReviewCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task GetReviewsByBusiness_ShouldReturnMappedDtos()
    {
        var businessId = Guid.NewGuid();
        var reviews = new List<Review>
        {
            Review.Create(businessId, Guid.NewGuid(), 5, "Amazing"),
            Review.Create(businessId, Guid.NewGuid(), 3, "OK"),
        };
        _reviewRepo.GetByBusinessIdAsync(businessId, Arg.Any<CancellationToken>())
            .Returns(reviews);

        var handler = new GetReviewsByBusinessQueryHandler(_reviewRepo);
        var result = await handler.Handle(new GetReviewsByBusinessQuery(businessId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
        Assert.Equal(5, result.Value[0].Rating);
    }

    [Fact]
    public async Task GetAllReviews_WithApprovedFilter_ShouldPassFilter()
    {
        _reviewRepo.GetAllAsync(true, Arg.Any<CancellationToken>())
            .Returns(new List<Review>());

        var handler = new GetAllReviewsQueryHandler(_reviewRepo);
        var result = await handler.Handle(new GetAllReviewsQuery(true), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await _reviewRepo.Received(1).GetAllAsync(true, Arg.Any<CancellationToken>());
    }
}
