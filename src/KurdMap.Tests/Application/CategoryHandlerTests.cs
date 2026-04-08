using KurdMap.Application.Categories.Commands.CreateCategory;
using KurdMap.Application.Categories.Commands.DeleteCategory;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Categories.Entities;
using KurdMap.Domain.Common;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class CategoryHandlerTests
{
    private readonly ICategoryRepository _categoryRepo = Substitute.For<ICategoryRepository>();
    private readonly ICacheService _cacheService = Substitute.For<ICacheService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    // === CreateCategory ===

    [Fact]
    public async Task CreateCategory_WhenSlugUnique_ShouldSucceed()
    {
        _categoryRepo.GetBySlugAsync("restaurant", Arg.Any<CancellationToken>()).Returns((Category?)null);

        var handler = new CreateCategoryCommandHandler(_categoryRepo, _cacheService, _unitOfWork);
        var command = new CreateCategoryCommand(
            new MultilingualTextDto("چێشتخانە", "kmr", "Restaurant", "Restaurant"),
            "restaurant", "utensils", 1);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("restaurant", result.Value!.Slug);
        Assert.Equal("چێشتخانە", result.Value.NameKu);
        Assert.Equal("Restaurant", result.Value.NameDe);
        await _categoryRepo.Received(1).AddAsync(Arg.Any<Category>(), Arg.Any<CancellationToken>());
        await _cacheService.Received(1).RemoveAsync("categories:all", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateCategory_WhenSlugDuplicate_ShouldFail()
    {
        var existing = Category.Create(
            MultilingualText.Create("ku", "de"), "restaurant", null, 1);
        _categoryRepo.GetBySlugAsync("restaurant", Arg.Any<CancellationToken>()).Returns(existing);

        var handler = new CreateCategoryCommandHandler(_categoryRepo, _cacheService, _unitOfWork);
        var command = new CreateCategoryCommand(
            new MultilingualTextDto("ku", "kmr", "de", "en"), "restaurant", null, 2);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("already exists", result.Error!);
    }

    // === DeleteCategory ===

    [Fact]
    public async Task DeleteCategory_WhenExists_ShouldSucceed()
    {
        var category = Category.Create(
            MultilingualText.Create("ku", "de"), "test", null, 1);
        _categoryRepo.GetByIdAsync(category.Id, Arg.Any<CancellationToken>()).Returns(category);

        var handler = new DeleteCategoryCommandHandler(_categoryRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteCategoryCommand(category.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _categoryRepo.Received(1).Remove(category);
        await _cacheService.Received(1).RemoveAsync("categories:all", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCategory_WhenNotFound_ShouldFail()
    {
        _categoryRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Category?)null);

        var handler = new DeleteCategoryCommandHandler(_categoryRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteCategoryCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }
}
