using KurdMap.Application.Cities.Commands.CreateCity;
using KurdMap.Application.Cities.Commands.DeleteCity;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Cities;
using KurdMap.Domain.Cities.Entities;
using KurdMap.Domain.Common;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class CityHandlerTests
{
    private readonly ICityRepository _cityRepo = Substitute.For<ICityRepository>();
    private readonly ICacheService _cacheService = Substitute.For<ICacheService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    // === CreateCity ===

    [Fact]
    public async Task CreateCity_WhenSlugUnique_ShouldSucceed()
    {
        _cityRepo.GetBySlugAsync("koeln", Arg.Any<CancellationToken>()).Returns((City?)null);

        var handler = new CreateCityCommandHandler(_cityRepo, _cacheService, _unitOfWork);
        var command = new CreateCityCommand(
            new MultilingualTextDto("کۆڵن", "Kolnê", "Köln", "Cologne"),
            "koeln", 50.9375m, 6.9603m);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("koeln", result.Value!.Slug);
        Assert.Equal("کۆڵن", result.Value.NameKu);
        Assert.Equal(50.9375m, result.Value.Latitude);
        await _cityRepo.Received(1).AddAsync(Arg.Any<City>(), Arg.Any<CancellationToken>());
        await _cacheService.Received(1).RemoveAsync("cities:all", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateCity_WhenSlugDuplicate_ShouldFail()
    {
        var existing = City.Create(
            MultilingualText.Create("ku", "de"), "koeln", 50m, 6m);
        _cityRepo.GetBySlugAsync("koeln", Arg.Any<CancellationToken>()).Returns(existing);

        var handler = new CreateCityCommandHandler(_cityRepo, _cacheService, _unitOfWork);
        var command = new CreateCityCommand(
            new MultilingualTextDto("ku", "kmr", "de", "en"), "koeln", 50m, 6m);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("already exists", result.Error!);
    }

    // === DeleteCity ===

    [Fact]
    public async Task DeleteCity_WhenExists_ShouldSucceed()
    {
        var city = City.Create(
            MultilingualText.Create("ku", "de"), "test", 50m, 6m);
        _cityRepo.GetByIdAsync(city.Id, Arg.Any<CancellationToken>()).Returns(city);

        var handler = new DeleteCityCommandHandler(_cityRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteCityCommand(city.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _cityRepo.Received(1).Remove(city);
        await _cacheService.Received(1).RemoveAsync("cities:all", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCity_WhenNotFound_ShouldFail()
    {
        _cityRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((City?)null);

        var handler = new DeleteCityCommandHandler(_cityRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteCityCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }
}
