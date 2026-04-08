using KurdMap.Domain.Advertisements.Entities;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Categories.Entities;
using KurdMap.Domain.Cities.Entities;
using KurdMap.Domain.ContactMessages.Entities;
using KurdMap.Domain.Favorites.Entities;
using KurdMap.Domain.Reviews.Entities;
using KurdMap.Domain.Users.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<BusinessImage> BusinessImages => Set<BusinessImage>();
    public DbSet<BusinessService> BusinessServices => Set<BusinessService>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Rename Identity tables to snake_case
        modelBuilder.Entity<ApplicationUser>().ToTable("users");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
    }
}
