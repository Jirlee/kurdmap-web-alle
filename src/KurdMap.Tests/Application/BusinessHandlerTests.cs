using KurdMap.Application.Businesses.Commands.CreateBusiness;
using KurdMap.Application.Businesses.Commands.DeleteBusiness;
using KurdMap.Application.Businesses.Commands.VerifyBusiness;
using KurdMap.Application.Businesses.Commands.SetDiscount;
using KurdMap.Application.Businesses.Commands.ClearDiscount;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Businesses;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Categories;
using KurdMap.Domain.Categories.Entities;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Cities.Entities;
using KurdMap.Domain.Common;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class BusinessHandlerTests
{
    private readonly IBusinessRepository _businessRepo = Substitute.For<IBusinessRepository>();
    private readonly ICategoryRepository _categoryRepo = Substitute.For<ICategoryRepository>();
    private readonly ICityRepository _cityRepo = Substitute.For<ICityRepository>();
    private readonly ISlugService _slugService = Substitute.For<ISlugService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private static MultilingualTextDto MakeTextDto(string prefix = "Test") =>
        new($"{prefix}-ku", $"{prefix}-kmr", $"{prefix}-de", $"{prefix}-en");

    private static Category MakeCategory() =>
        Category.Create(MultilingualText.Create("ku", "de", "kmr", "en"), "test-cat", "icon", 1);

    private static City MakeCity() =>
        City.Create(MultilingualText.Create("ku", "de", "kmr", "en"), "test-city", 50.9m, 6.9m);

    // === CreateBusiness ===

    [Fact]
    public async Task CreateBusiness_WhenValid_ShouldSucceed()
    {
        var category = MakeCategory();
        var city = MakeCity();
        _categoryRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(category);
        _cityRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(city);
        _slugService.GenerateUniqueSlugAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns("test-slug");

        var handler = new CreateBusinessCommandHandler(
            _businessRepo, _categoryRepo, _cityRepo, _slugService, _unitOfWork);

        var command = new CreateBusinessCommand(
            MakeTextDto("Name"), MakeTextDto("Desc"),
            category.Id, "Street 1", "50667", city.Id,
            50.9375m, 6.9603m, "0221-123", "test@test.de", "https://test.de");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("test-slug", result.Value!.Slug);
        await _businessRepo.Received(1).AddAsync(Arg.Any<Business>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateBusiness_WhenCategoryNotFound_ShouldFail()
    {
        _categoryRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Category?)null);

        var handler = new CreateBusinessCommandHandler(
            _businessRepo, _categoryRepo, _cityRepo, _slugService, _unitOfWork);

        var command = new CreateBusinessCommand(
            MakeTextDto(), MakeTextDto(), Guid.NewGuid(), "Street", "50667",
            Guid.NewGuid(), 50m, 6m, null, null, null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("Category", result.Error!);
    }

    [Fact]
    public async Task CreateBusiness_WhenCityNotFound_ShouldFail()
    {
        var category = MakeCategory();
        _categoryRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(category);
        _cityRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((City?)null);

        var handler = new CreateBusinessCommandHandler(
            _businessRepo, _categoryRepo, _cityRepo, _slugService, _unitOfWork);

        var command = new CreateBusinessCommand(
            MakeTextDto(), MakeTextDto(), category.Id, "Street", "50667",
            Guid.NewGuid(), 50m, 6m, null, null, null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("City", result.Error!);
    }

    // === DeleteBusiness ===

    [Fact]
    public async Task DeleteBusiness_WhenExists_ShouldSucceed()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "slug",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));

        _businessRepo.GetByIdAsync(business.Id, Arg.Any<CancellationToken>()).Returns(business);

        var handler = new DeleteBusinessCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(new DeleteBusinessCommand(business.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _businessRepo.Received(1).Update(business);
    }

    [Fact]
    public async Task DeleteBusiness_WhenNotFound_ShouldFail()
    {
        _businessRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Business?)null);

        var handler = new DeleteBusinessCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(new DeleteBusinessCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }

    // === VerifyBusiness ===

    [Fact]
    public async Task VerifyBusiness_WhenExists_ShouldSetVerified()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "slug",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));

        _businessRepo.GetByIdAsync(business.Id, Arg.Any<CancellationToken>()).Returns(business);

        var handler = new VerifyBusinessCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(new VerifyBusinessCommand(business.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(business.IsVerified);
    }

    [Fact]
    public async Task VerifyBusiness_WhenNotFound_ShouldFail()
    {
        _businessRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Business?)null);

        var handler = new VerifyBusinessCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(new VerifyBusinessCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    // === SetDiscount ===

    [Fact]
    public async Task SetDiscount_WhenValid_ShouldSucceed()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "slug",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));

        _businessRepo.GetByIdAsync(business.Id, Arg.Any<CancellationToken>()).Returns(business);

        var handler = new SetBusinessDiscountCommandHandler(_businessRepo, _unitOfWork);
        var command = new SetBusinessDiscountCommand(
            business.Id, 20, MakeTextDto("Discount"), DateTime.UtcNow, DateTime.UtcNow.AddDays(7));

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(20, business.DiscountPercentage);
        _businessRepo.Received(1).Update(business);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SetDiscount_WhenNotFound_ShouldFail()
    {
        _businessRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Business?)null);

        var handler = new SetBusinessDiscountCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(
            new SetBusinessDiscountCommand(Guid.NewGuid(), 10), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }

    [Fact]
    public async Task SetDiscount_InvalidPercentage_ShouldThrowDomainException()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "slug",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));

        _businessRepo.GetByIdAsync(business.Id, Arg.Any<CancellationToken>()).Returns(business);

        var handler = new SetBusinessDiscountCommandHandler(_businessRepo, _unitOfWork);
        var command = new SetBusinessDiscountCommand(business.Id, 150);

        await Assert.ThrowsAsync<DomainException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    // === ClearDiscount ===

    [Fact]
    public async Task ClearDiscount_WhenExists_ShouldClearAll()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "slug",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));
        business.SetDiscount(30, null, null, null);

        _businessRepo.GetByIdAsync(business.Id, Arg.Any<CancellationToken>()).Returns(business);

        var handler = new ClearBusinessDiscountCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(new ClearBusinessDiscountCommand(business.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Null(business.DiscountPercentage);
        Assert.False(business.HasActiveDiscount);
        _businessRepo.Received(1).Update(business);
    }

    [Fact]
    public async Task ClearDiscount_WhenNotFound_ShouldFail()
    {
        _businessRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Business?)null);

        var handler = new ClearBusinessDiscountCommandHandler(_businessRepo, _unitOfWork);
        var result = await handler.Handle(
            new ClearBusinessDiscountCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }
}
