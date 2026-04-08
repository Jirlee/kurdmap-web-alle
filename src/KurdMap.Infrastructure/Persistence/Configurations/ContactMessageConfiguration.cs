using KurdMap.Domain.ContactMessages.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.ToTable("contact_messages");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Email).IsRequired().HasMaxLength(200);
        builder.Property(m => m.Message).IsRequired().HasMaxLength(5000);
        builder.Property(m => m.IsRead).HasDefaultValue(false);

        builder.HasIndex(m => m.CreatedAt);
    }
}
