using KurdMap.Domain.Businesses.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class BusinessServiceConfiguration : IEntityTypeConfiguration<BusinessService>
{
    public void Configure(EntityTypeBuilder<BusinessService> builder)
    {
        builder.ToTable("business_services");

        builder.HasKey(s => s.Id);

        builder.OwnsOne(s => s.Name, name =>
        {
            name.Property(n => n.Ku).HasColumnName("name_ku").HasMaxLength(200).IsRequired();
            name.Property(n => n.Kmr).HasColumnName("name_kmr").HasMaxLength(200);
            name.Property(n => n.De).HasColumnName("name_de").HasMaxLength(200).IsRequired();
            name.Property(n => n.En).HasColumnName("name_en").HasMaxLength(200);
        });

        builder.OwnsOne(s => s.Description, desc =>
        {
            desc.Property(d => d.Ku).HasColumnName("description_ku");
            desc.Property(d => d.Kmr).HasColumnName("description_kmr");
            desc.Property(d => d.De).HasColumnName("description_de");
            desc.Property(d => d.En).HasColumnName("description_en");
        });

        builder.Property(s => s.Price).HasPrecision(10, 2);

        builder.HasIndex(s => new { s.BusinessId, s.SortOrder })
            .HasDatabaseName("ix_business_services_sort");
    }
}
