using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Entities;

public class BusinessImage : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string? AltText { get; private set; }
    public bool IsPrimary { get; private set; }
    public int SortOrder { get; private set; }

    private BusinessImage() { }

    public static BusinessImage Create(Guid businessId, string url, string? altText, bool isPrimary, int sortOrder)
    {
        return new BusinessImage
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            Url = url,
            AltText = altText,
            IsPrimary = isPrimary,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void SetNotPrimary() => IsPrimary = false;
    public void SetAsPrimary() => IsPrimary = true;
}
