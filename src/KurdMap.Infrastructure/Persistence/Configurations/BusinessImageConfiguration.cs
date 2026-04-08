using KurdMap.Domain.Businesses.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class BusinessImageConfiguration : IEntityTypeConfiguration<BusinessImage>
{
    public void Configure(EntityTypeBuilder<BusinessImage> builder)
    {
        builder.ToTable("business_images");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Url).HasMaxLength(1000).IsRequired();
        builder.Property(i => i.AltText).HasMaxLength(300);

        builder.Property(i => i.IsPrimary).HasDefaultValue(false);

        builder.HasIndex(i => new { i.BusinessId, i.SortOrder })
            .HasDatabaseName("ix_business_images_sort");
    }
}
