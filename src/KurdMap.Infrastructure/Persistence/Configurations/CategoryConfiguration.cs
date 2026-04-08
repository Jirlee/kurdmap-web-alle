using KurdMap.Domain.Categories.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.Name, name =>
        {
            name.Property(n => n.Ku).HasColumnName("name_ku").HasMaxLength(150).IsRequired();
            name.Property(n => n.Kmr).HasColumnName("name_kmr").HasMaxLength(150);
            name.Property(n => n.De).HasColumnName("name_de").HasMaxLength(150).IsRequired();
            name.Property(n => n.En).HasColumnName("name_en").HasMaxLength(150);
        });

        builder.Property(c => c.Slug).HasMaxLength(150).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique().HasDatabaseName("ix_categories_slug");

        builder.Property(c => c.Icon).HasMaxLength(100);

        builder.HasIndex(c => c.SortOrder).HasDatabaseName("ix_categories_sort");
    }
}
