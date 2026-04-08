using KurdMap.Domain.Advertisements.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class AdvertisementConfiguration : IEntityTypeConfiguration<Advertisement>
{
    public void Configure(EntityTypeBuilder<Advertisement> builder)
    {
        builder.ToTable("advertisements");

        builder.HasKey(a => a.Id);

        builder.OwnsOne(a => a.Title, title =>
        {
            title.Property(t => t.Ku).HasColumnName("title_ku").HasMaxLength(200).IsRequired();
            title.Property(t => t.Kmr).HasColumnName("title_kmr").HasMaxLength(200);
            title.Property(t => t.De).HasColumnName("title_de").HasMaxLength(200).IsRequired();
            title.Property(t => t.En).HasColumnName("title_en").HasMaxLength(200);
        });

        builder.OwnsOne(a => a.Description, desc =>
        {
            desc.Property(d => d.Ku).HasColumnName("description_ku").HasMaxLength(500);
            desc.Property(d => d.Kmr).HasColumnName("description_kmr").HasMaxLength(500);
            desc.Property(d => d.De).HasColumnName("description_de").HasMaxLength(500);
            desc.Property(d => d.En).HasColumnName("description_en").HasMaxLength(500);
        });

        builder.Property(a => a.ImageUrl).HasMaxLength(500).IsRequired();
        builder.Property(a => a.LinkUrl).HasMaxLength(500);
        builder.Property(a => a.StartDate).IsRequired();
        builder.Property(a => a.EndDate).IsRequired();
        builder.Property(a => a.IsActive).HasDefaultValue(true);

        builder.HasIndex(a => new { a.IsActive, a.StartDate, a.EndDate })
            .HasDatabaseName("ix_advertisements_active_dates");
    }
}
