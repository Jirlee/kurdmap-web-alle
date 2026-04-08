using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Categories.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Categories.Commands.UpdateCategory;

public sealed record UpdateCategoryCommand(
    Guid Id,
    MultilingualTextDto Name,
    string? Icon,
    int SortOrder) : IRequest<Result<CategoryDto>>;

public sealed class UpdateCategoryCommandHandler(
    ICategoryRepository categoryRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken ct)
    {
        var category = await categoryRepository.GetByIdAsync(request.Id, ct);
        if (category is null)
            return Result<CategoryDto>.Failure($"Category with ID '{request.Id}' not found.");

        var name = MultilingualText.Create(request.Name.Ku, request.Name.De, request.Name.Kmr ?? "", request.Name.En ?? "");
        category.Update(name, request.Icon, request.SortOrder);

        categoryRepository.Update(category);
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
