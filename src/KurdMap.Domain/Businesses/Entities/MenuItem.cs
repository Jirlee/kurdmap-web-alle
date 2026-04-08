using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Entities;

public class MenuItem : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public MultilingualText Name { get; private set; } = null!;
    public MultilingualText? Description { get; private set; }
    public decimal? Price { get; private set; }
    public string? ImageUrl { get; private set; }
    public int SortOrder { get; private set; }

    private MenuItem() { }

    public static MenuItem Create(
        Guid businessId, MultilingualText name, MultilingualText? description,
        decimal? price, string? imageUrl, int sortOrder)
    {
        return new MenuItem
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            Name = name,
            Description = description,
            Price = price,
            ImageUrl = imageUrl,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
