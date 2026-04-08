using KurdMap.Domain.Favorites.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KurdMap.Infrastructure.Persistence.Configurations;

public class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("favorites");

        builder.HasKey(f => f.Id);
        builder.HasIndex(f => new { f.BusinessId, f.UserId }).IsUnique();
        builder.HasIndex(f => f.UserId);
    }
}
