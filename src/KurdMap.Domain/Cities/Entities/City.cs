using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Domain.Cities.Entities;

public class City : BaseEntity
{
    public MultilingualText Name { get; private set; } = null!;
    public string Slug { get; private set; } = string.Empty;
    public decimal Latitude { get; private set; }
    public decimal Longitude { get; private set; }

    private City() { }

    public static City Create(MultilingualText name, string slug, decimal latitude, decimal longitude)
    {
        return new City
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Latitude = latitude,
            Longitude = longitude,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(MultilingualText name, decimal latitude, decimal longitude)
    {
        Name = name;
        Latitude = latitude;
        Longitude = longitude;
        UpdatedAt = DateTime.UtcNow;
    }
}
