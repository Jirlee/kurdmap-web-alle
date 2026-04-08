using KurdMap.Application.Categories.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Categories;
using MediatR;

namespace KurdMap.Application.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery : IRequest<Result<List<CategoryDto>>>;

public sealed class GetCategoriesQueryHandler(
    ICategoryRepository categoryRepository,
    ICacheService cacheService) : IRequestHandler<GetCategoriesQuery, Result<List<CategoryDto>>>
{
    private const string CacheKey = "categories:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    public async Task<Result<List<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken ct)
    {
        var cached = await cacheService.GetAsync<List<CategoryDto>>(CacheKey, ct);
        if (cached is not null)
            return cached;

        var categories = await categoryRepository.GetAllAsync(ct);

        var dtos = categories.Select(c => new CategoryDto(
            c.Id,
            c.Slug,
            c.Name.Ku,
            c.Name.Kmr,
            c.Name.De,
            c.Name.En,
            c.Icon,
            c.SortOrder)).ToList();

        await cacheService.SetAsync(CacheKey, dtos, CacheTtl, ct);

        return dtos;
    }
}
