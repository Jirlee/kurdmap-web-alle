using KurdMap.Domain.Businesses.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("menu_items");

        builder.HasKey(m => m.Id);

        builder.OwnsOne(m => m.Name, name =>
        {
            name.Property(n => n.Ku).HasColumnName("name_ku").HasMaxLength(200).IsRequired();
            name.Property(n => n.Kmr).HasColumnName("name_kmr").HasMaxLength(200);
            name.Property(n => n.De).HasColumnName("name_de").HasMaxLength(200).IsRequired();
            name.Property(n => n.En).HasColumnName("name_en").HasMaxLength(200);
        });

        builder.OwnsOne(m => m.Description, desc =>
        {
            desc.Property(d => d.Ku).HasColumnName("description_ku");
            desc.Property(d => d.Kmr).HasColumnName("description_kmr");
            desc.Property(d => d.De).HasColumnName("description_de");
            desc.Property(d => d.En).HasColumnName("description_en");
        });

        builder.Property(m => m.Price).HasPrecision(10, 2);
        builder.Property(m => m.ImageUrl).HasMaxLength(1000);

        builder.HasIndex(m => new { m.BusinessId, m.SortOrder })
            .HasDatabaseName("ix_menu_items_sort");
    }
}
