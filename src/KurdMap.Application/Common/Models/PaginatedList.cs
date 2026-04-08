using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.Application.Common.Models;

public class PaginatedList<T>
{
    public List<T> Items { get; }
    public int PageNumber { get; }
    public int TotalPages { get; }
    public int TotalCount { get; }
    public bool HasPreviousPage { get; }
    public bool HasNextPage { get; }

    [JsonConstructor]
    public PaginatedList(List<T> items, int pageNumber, int totalPages, int totalCount, bool hasPreviousPage, bool hasNextPage)
    {
        Items = items;
        PageNumber = pageNumber;
        TotalPages = totalPages;
        TotalCount = totalCount;
        HasPreviousPage = hasPreviousPage;
        HasNextPage = hasNextPage;
    }

    public PaginatedList(List<T> items, int count, int pageNumber, int pageSize)
    {
        PageNumber = pageNumber;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
        TotalCount = count;
        Items = items;
        HasPreviousPage = PageNumber > 1;
        HasNextPage = PageNumber < TotalPages;
    }

    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var count = await source.CountAsync(ct);
        var items = await source
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginatedList<T>(items, count, pageNumber, pageSize);
    }
}
