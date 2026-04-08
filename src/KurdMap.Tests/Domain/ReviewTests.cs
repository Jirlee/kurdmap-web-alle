using KurdMap.Domain.Reviews.Entities;

namespace KurdMap.Tests.Domain;

public class ReviewTests
{
    [Fact]
    public void Create_WithValidData_ShouldReturnReview()
    {
        var businessId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var review = Review.Create(businessId, userId, 4, "Great place!");

        Assert.Equal(businessId, review.BusinessId);
        Assert.Equal(userId, review.UserId);
        Assert.Equal(4, review.Rating);
        Assert.Equal("Great place!", review.Comment);
        Assert.False(review.IsApproved);
        Assert.NotEqual(Guid.Empty, review.Id);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(6)]
    [InlineData(100)]
    public void Create_WithInvalidRating_ShouldThrow(int rating)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            Review.Create(Guid.NewGuid(), Guid.NewGuid(), rating, "Test"));
    }

    [Fact]
    public void Create_WithNullComment_ShouldSucceed()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 3, null);

        Assert.Null(review.Comment);
        Assert.Equal(3, review.Rating);
    }

    [Fact]
    public void Approve_ShouldSetIsApprovedTrue()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 5, "Amazing");
        Assert.False(review.IsApproved);

        review.Approve();

        Assert.True(review.IsApproved);
    }

    [Fact]
    public void Reject_ShouldSetIsApprovedFalse()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 5, "Test");
        review.Approve();
        Assert.True(review.IsApproved);

        review.Reject();

        Assert.False(review.IsApproved);
    }

    [Fact]
    public void UpdateComment_ShouldTrimAndSetComment()
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), 3, "Original");

        review.UpdateComment("  Updated comment  ");

        Assert.Equal("Updated comment", review.Comment);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Create_WithValidRatings_ShouldSucceed(int rating)
    {
        var review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), rating, "Test");
        Assert.Equal(rating, review.Rating);
    }
}
