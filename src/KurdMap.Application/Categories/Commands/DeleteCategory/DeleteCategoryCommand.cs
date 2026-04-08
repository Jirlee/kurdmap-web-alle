using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Categories.Commands.DeleteCategory;

public sealed record DeleteCategoryCommand(Guid Id) : IRequest<Result>;

public sealed class DeleteCategoryCommandHandler(
    ICategoryRepository categoryRepository,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCategoryCommand, Result>
{
    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken ct)
    {
        var category = await categoryRepository.GetByIdAsync(request.Id, ct);
        if (category is null)
            return Result.Failure($"Category with ID '{request.Id}' not found.");

        categoryRepository.Remove(category);
        await unitOfWork.SaveChangesAsync(ct);

        await cacheService.RemoveAsync("categories:all", ct);

        return Result.Success();
    }
}
