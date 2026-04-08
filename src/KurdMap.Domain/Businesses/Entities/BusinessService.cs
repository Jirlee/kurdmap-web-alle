using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Entities;

public class BusinessService : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public MultilingualText Name { get; private set; } = null!;
    public MultilingualText? Description { get; private set; }
    public decimal? Price { get; private set; }
    public int SortOrder { get; private set; }

    private BusinessService() { }

    public static BusinessService Create(
        Guid businessId, MultilingualText name, MultilingualText? description,
        decimal? price, int sortOrder)
    {
        return new BusinessService
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            Name = name,
            Description = description,
            Price = price,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
