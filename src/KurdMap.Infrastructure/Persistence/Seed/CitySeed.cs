using KurdMap.Domain.Cities.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Seed;

public class CitySeed : IEntityTypeConfiguration<City>
{
    public void Configure(EntityTypeBuilder<City> builder)
    {
        var now = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.HasData(
            new
            {
                Id = Guid.Parse("c1c1c1c1-0001-0001-0001-000000000001"),
                Slug = "koeln",
                Latitude = 50.9375m,
                Longitude = 6.9603m,
                CreatedAt = now,
                UpdatedAt = now
            },
            new
            {
                Id = Guid.Parse("c1c1c1c1-0001-0001-0001-000000000002"),
                Slug = "duesseldorf",
                Latitude = 51.2277m,
                Longitude = 6.7735m,
                CreatedAt = now,
                UpdatedAt = now
            }
        );

        builder.OwnsOne(c => c.Name).HasData(
            new { CityId = Guid.Parse("c1c1c1c1-0001-0001-0001-000000000001"), Ku = "کۆڵن", Kmr = "Köln", De = "Köln", En = "Cologne" },
            new { CityId = Guid.Parse("c1c1c1c1-0001-0001-0001-000000000002"), Ku = "دۆسڵدۆرف", Kmr = "Düsseldorf", De = "Düsseldorf", En = "Düsseldorf" }
        );
    }
}
