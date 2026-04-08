using KurdMap.Domain.Reviews.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("reviews");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Rating).IsRequired();
        builder.Property(r => r.Comment).HasMaxLength(2000);
        builder.Property(r => r.IsApproved).HasDefaultValue(false);

        builder.HasIndex(r => r.BusinessId);
        builder.HasIndex(r => new { r.BusinessId, r.UserId }).IsUnique();
    }
}
