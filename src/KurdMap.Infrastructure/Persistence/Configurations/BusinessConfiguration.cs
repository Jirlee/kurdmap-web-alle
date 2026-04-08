using System.Text.Json;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories.Entities;
using KurdMap.Domain.Enums;
using KurdMap.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> builder)
    {
        builder.ToTable("businesses");

        builder.HasKey(b => b.Id);

        builder.OwnsOne(b => b.Name, name =>
        {
            name.Property(n => n.Ku).HasColumnName("name_ku").HasMaxLength(200).IsRequired();
            name.Property(n => n.Kmr).HasColumnName("name_kmr").HasMaxLength(200);
            name.Property(n => n.De).HasColumnName("name_de").HasMaxLength(200).IsRequired();
            name.Property(n => n.En).HasColumnName("name_en").HasMaxLength(200);
        });

        builder.OwnsOne(b => b.Description, desc =>
        {
            desc.Property(d => d.Ku).HasColumnName("description_ku");
            desc.Property(d => d.Kmr).HasColumnName("description_kmr");
            desc.Property(d => d.De).HasColumnName("description_de");
            desc.Property(d => d.En).HasColumnName("description_en");
        });

        builder.Property(b => b.Slug).HasMaxLength(250).IsRequired();
        builder.HasIndex(b => b.Slug).IsUnique().HasDatabaseName("ix_businesses_slug");

        builder.OwnsOne(b => b.Address, address =>
        {
            address.Property(a => a.Street).HasColumnName("street").HasMaxLength(300).IsRequired();
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(10).IsRequired();
            address.Property(a => a.CityId).HasColumnName("city_id");
        });

        builder.OwnsOne(b => b.Location, loc =>
        {
            loc.Property(l => l.Latitude).HasColumnName("latitude").HasPrecision(10, 7).IsRequired();
            loc.Property(l => l.Longitude).HasColumnName("longitude").HasPrecision(10, 7).IsRequired();
        });

        builder.Property(b => b.Phone).HasMaxLength(20);
        builder.Property(b => b.Email).HasMaxLength(200);
        builder.Property(b => b.Website).HasMaxLength(500);

        builder.Property(b => b.Hours)
            .HasColumnName("opening_hours")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<OpeningHours>(v, (JsonSerializerOptions?)null));

        builder.Property(b => b.Status)
            .HasDefaultValue(BusinessStatus.Pending);

        builder.Property(b => b.IsVerified)
            .HasDefaultValue(false);

        // Discount / Promotion
        builder.Property(b => b.DiscountPercentage)
            .HasColumnName("discount_percentage");

        builder.OwnsOne(b => b.DiscountDescription, dd =>
        {
            dd.Property(d => d.Ku).HasColumnName("discount_description_ku").HasMaxLength(500);
            dd.Property(d => d.Kmr).HasColumnName("discount_description_kmr").HasMaxLength(500);
            dd.Property(d => d.De).HasColumnName("discount_description_de").HasMaxLength(500);
            dd.Property(d => d.En).HasColumnName("discount_description_en").HasMaxLength(500);
        });

        builder.Property(b => b.DiscountStartDate)
            .HasColumnName("discount_start_date");

        builder.Property(b => b.DiscountEndDate)
            .HasColumnName("discount_end_date");

        builder.Ignore(b => b.HasActiveDiscount);

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(b => b.OwnerId)
            .IsRequired(false);

        builder.HasMany(b => b.Images)
            .WithOne()
            .HasForeignKey(i => i.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Services)
            .WithOne()
            .HasForeignKey(s => s.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.MenuItems)
            .WithOne()
            .HasForeignKey(m => m.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.CategoryId).HasDatabaseName("ix_businesses_city_category");
        builder.HasIndex(b => b.Status).HasDatabaseName("ix_businesses_status");
        builder.HasIndex(b => b.OwnerId).HasDatabaseName("ix_businesses_owner");

        // Full-text search GIN index (applied via migration SQL)
        // CREATE INDEX ix_businesses_search ON businesses USING gin (
        //   to_tsvector('simple',
        //     coalesce(name_ku, '') || ' ' ||
        //     coalesce(name_kmr, '') || ' ' ||
        //     coalesce(name_de, '') || ' ' ||
        //     coalesce(name_en, '')));

        builder.Ignore(b => b.DomainEvents);
    }
}
