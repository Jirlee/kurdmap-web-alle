using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Categories.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Categories.Entities;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Categories.Commands.CreateCategory;

public sealed record CreateCategoryCommand(
    MultilingualTextDto Name,
    string? Icon,
    int SortOrder) : IRequest<Result<CategoryDto>>;

public sealed class CreateCategoryCommandHandler(
    ICategoryRepository categoryRepository,
    ISlugService slugService,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        var baseSlug = slugService.GenerateSlug(request.Name.De);
        if (string.IsNullOrEmpty(baseSlug))
            return Result<CategoryDto>.Failure("Could not generate a slug from the category name.");

        var slug = baseSlug;
        var counter = 1;
        while (await categoryRepository.GetBySlugAsync(slug, ct) is not null)
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var category = Category.Create(name, slug, request.Icon, request.SortOrder);

        await categoryRepository.AddAsync(category, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await cacheService.RemoveAsync("categories:all", ct);

        return new CategoryDto(
            category.Id,
            category.Slug,
            category.Name.Ku,
            category.Name.Kmr,
            category.Name.De,
            category.Name.En,
            category.Icon,
            category.SortOrder);
    }
}
