using KurdMap.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id).HasColumnName("id");

        builder.Property(rt => rt.Token)
            .HasColumnName("token")
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(rt => rt.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(rt => rt.ReplacedByToken)
            .HasColumnName("replaced_by_token")
            .HasMaxLength(512);

        builder.Property(rt => rt.Family)
            .HasColumnName("family")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(rt => rt.CreatedByIp)
            .HasColumnName("created_by_ip")
            .HasMaxLength(45)
            .IsRequired();

        builder.Property(rt => rt.RevokedByIp)
            .HasColumnName("revoked_by_ip")
            .HasMaxLength(45);

        builder.Property(rt => rt.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamptz");

        builder.Property(rt => rt.ExpiresAt)
            .HasColumnName("expires_at")
            .HasColumnType("timestamptz");

        builder.Property(rt => rt.RevokedAt)
            .HasColumnName("revoked_at")
            .HasColumnType("timestamptz");

        builder.Ignore(rt => rt.IsExpired);
        builder.Ignore(rt => rt.IsRevoked);
        builder.Ignore(rt => rt.IsActive);

        // Indexes
        builder.HasIndex(rt => rt.Token).IsUnique().HasDatabaseName("ix_refresh_tokens_token");
        builder.HasIndex(rt => rt.UserId).HasDatabaseName("ix_refresh_tokens_user_id");
        builder.HasIndex(rt => rt.Family).HasDatabaseName("ix_refresh_tokens_family");
        builder.HasIndex(rt => rt.ExpiresAt).HasDatabaseName("ix_refresh_tokens_expires_at");

        // Relationships
        builder.HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
