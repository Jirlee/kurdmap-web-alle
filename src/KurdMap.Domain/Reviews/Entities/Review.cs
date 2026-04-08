using KurdMap.Domain.Common;

namespace KurdMap.Domain.Reviews.Entities;

public class Review : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public bool IsApproved { get; private set; }

    private Review() { }

    public static Review Create(Guid businessId, Guid userId, int rating, string? comment)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");

        return new Review
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            UserId = userId,
            Rating = rating,
            Comment = comment?.Trim(),
            IsApproved = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Approve()
    {
        IsApproved = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        IsApproved = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateComment(string? comment)
    {
        Comment = comment?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
