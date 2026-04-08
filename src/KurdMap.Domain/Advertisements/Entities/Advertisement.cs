using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Domain.Advertisements.Entities;

public class Advertisement : BaseEntity
{
    public MultilingualText Title { get; private set; } = null!;
    public MultilingualText? Description { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public string? LinkUrl { get; private set; }
    public Guid? BusinessId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }

    private Advertisement() { }

    public static Advertisement Create(
        MultilingualText title,
        MultilingualText? description,
        string imageUrl,
        string? linkUrl,
        Guid? businessId,
        DateTime startDate,
        DateTime endDate,
        int sortOrder)
    {
        if (endDate <= startDate)
            throw new DomainException("End date must be after start date.");

        return new Advertisement
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = description,
            ImageUrl = imageUrl,
            LinkUrl = linkUrl,
            BusinessId = businessId,
            StartDate = startDate,
            EndDate = endDate,
            IsActive = true,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        MultilingualText title,
        MultilingualText? description,
        string imageUrl,
        string? linkUrl,
        DateTime startDate,
        DateTime endDate,
        int sortOrder)
    {
        if (endDate <= startDate)
            throw new DomainException("End date must be after start date.");

        Title = title;
        Description = description;
        ImageUrl = imageUrl;
        LinkUrl = linkUrl;
        StartDate = startDate;
        EndDate = endDate;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsCurrentlyRunning => IsActive && DateTime.UtcNow >= StartDate && DateTime.UtcNow <= EndDate;
}
