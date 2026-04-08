using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.Entities;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Infrastructure.Persistence.Repositories;

public sealed class BusinessRepository(AppDbContext context) : IBusinessRepository
{
    public async Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Businesses
            .Include(b => b.Images)
            .Include(b => b.Services)
            .Include(b => b.MenuItems)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<Business?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await context.Businesses
            .AsNoTracking()
            .Include(b => b.Images)
            .Include(b => b.Services)
            .Include(b => b.MenuItems)
            .FirstOrDefaultAsync(b => b.Slug == slug, ct);

    public IQueryable<Business> GetQueryable()
        => context.Businesses
            .Include(b => b.Images)
            .AsNoTracking();

    public IQueryable<Business> ApplyFullTextSearch(IQueryable<Business> query, string searchTerm)
        => query.Where(b =>
            EF.Functions.ToTsVector("simple",
                b.Name.Ku + " " + b.Name.De + " " + (b.Name.Kmr ?? "") + " " + (b.Name.En ?? ""))
            .Matches(EF.Functions.PlainToTsQuery("simple", searchTerm)));

    public IOrderedQueryable<Business> OrderBySearchRelevance(IQueryable<Business> query, string searchTerm)
        => query.OrderByDescending(b =>
            EF.Functions.ToTsVector("simple",
                b.Name.Ku + " " + b.Name.De + " " + (b.Name.Kmr ?? "") + " " + (b.Name.En ?? ""))
            .Rank(EF.Functions.PlainToTsQuery("simple", searchTerm)));

    public async Task AddAsync(Business business, CancellationToken ct = default)
        => await context.Businesses.AddAsync(business, ct);

    public void Update(Business business)
        => context.Businesses.Update(business);

    public void Remove(Business business)
        => context.Businesses.Remove(business);
}
