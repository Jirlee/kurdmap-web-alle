using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Domain.Categories.Entities;

public class Category : BaseEntity
{
    public MultilingualText Name { get; private set; } = null!;
    public string Slug { get; private set; } = string.Empty;
    public string? Icon { get; private set; }
    public int SortOrder { get; private set; }

    private Category() { }

    public static Category Create(MultilingualText name, string slug, string? icon, int sortOrder)
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Icon = icon,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(MultilingualText name, string? icon, int sortOrder)
    {
        Name = name;
        Icon = icon;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}
