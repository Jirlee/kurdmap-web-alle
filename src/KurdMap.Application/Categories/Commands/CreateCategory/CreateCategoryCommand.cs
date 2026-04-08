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
    string Slug,
    string? Icon,
    int SortOrder) : IRequest<Result<CategoryDto>>;

public sealed class CreateCategoryCommandHandler(
    ICategoryRepository categoryRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        var existing = await categoryRepository.GetBySlugAsync(request.Slug, ct);
        if (existing is not null)
            return Result<CategoryDto>.Failure($"Category with slug '{request.Slug}' already exists.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        var category = Category.Create(name, request.Slug, request.Icon, request.SortOrder);

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
