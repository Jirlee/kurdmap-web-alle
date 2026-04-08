using KurdMap.Domain.Categories.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Seed;

public class CategorySeed : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        var now = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.HasData(
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000001", "restaurant", "material-symbols:restaurant", 1, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000002", "grocery", "material-symbols:local-grocery-store", 2, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000003", "barber", "material-symbols:content-cut", 3, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000004", "bakery", "material-symbols:bakery-dining", 4, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000005", "travel-agency", "material-symbols:flight", 5, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000006", "doctor", "material-symbols:medical-services", 6, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000007", "lawyer", "material-symbols:gavel", 7, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000008", "real-estate", "material-symbols:house", 8, now),
            CreateCategory("d1a1b2c3-0001-0001-0001-000000000009", "other", "material-symbols:more-horiz", 9, now)
        );

        // Owned type seed data for Name
        builder.OwnsOne(c => c.Name).HasData(
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000001"), Ku = "چێشتخانە", Kmr = "Xwaringeh", De = "Restaurant", En = "Restaurant" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000002"), Ku = "سوپەرمارکێت", Kmr = "Dikana firotanê", De = "Lebensmittelgeschäft", En = "Grocery" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000003"), Ku = "دەلاک", Kmr = "Berber", De = "Friseur", En = "Barber" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000004"), Ku = "نانەوا", Kmr = "Firna nan", De = "Bäckerei", En = "Bakery" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000005"), Ku = "ئاژانسی گەشتوگوزار", Kmr = "Ajansa rêwîtiyê", De = "Reisebüro", En = "Travel Agency" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000006"), Ku = "دکتۆر", Kmr = "Doktor", De = "Arzt", En = "Doctor" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000007"), Ku = "پارێزەر", Kmr = "Parêzer", De = "Anwalt", En = "Lawyer" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000008"), Ku = "خانووبەرە", Kmr = "Xanî û milk", De = "Immobilien", En = "Real Estate" },
            new { CategoryId = Guid.Parse("d1a1b2c3-0001-0001-0001-000000000009"), Ku = "هی تر", Kmr = "Yên din", De = "Sonstiges", En = "Other" }
        );
    }

    private static object CreateCategory(string id, string slug, string icon, int sortOrder, DateTime now)
        => new
        {
            Id = Guid.Parse(id),
            Slug = slug,
            Icon = icon,
            SortOrder = sortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };
}
