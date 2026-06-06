using KurdMap.Application.Advertisements.Commands.CreateAdvertisement;
using KurdMap.Application.Advertisements.Commands.DeleteAdvertisement;
using KurdMap.Application.Advertisements.Commands.ToggleAdvertisement;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Advertisements;
using KurdMap.Domain.Advertisements.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using NSubstitute;

namespace KurdMap.Tests.Application;

public class AdvertisementHandlerTests
{
    private readonly IAdvertisementRepository _adRepo = Substitute.For<IAdvertisementRepository>();
    private readonly ICacheService _cacheService = Substitute.For<ICacheService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    // === CreateAdvertisement ===

    [Fact]
    public async Task CreateAdvertisement_WhenValid_ShouldSucceed()
    {
        var handler = new CreateAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var command = new CreateAdvertisementCommand(
            new MultilingualTextDto("ڕیکلام", "kmr", "Werbung", "Ad"),
            new MultilingualTextDto("وەسف", "kmr", "Beschreibung", "Description"),
            "https://img.test/ad.jpg", "https://link.test",
            null, DateTime.UtcNow, DateTime.UtcNow.AddDays(30), 1);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("ڕیکلام", result.Value!.TitleKu);
        Assert.Equal("Werbung", result.Value.TitleDe);
        Assert.True(result.Value.IsActive);
        await _adRepo.Received(1).AddAsync(Arg.Any<Advertisement>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAdvertisement_WhenEndBeforeStart_ShouldThrowDomainException()
    {
        var handler = new CreateAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var command = new CreateAdvertisementCommand(
            new MultilingualTextDto("ku", "kmr", "de", "en"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow.AddDays(30), DateTime.UtcNow, 1);

        await Assert.ThrowsAsync<DomainException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    // === DeleteAdvertisement ===

    [Fact]
    public async Task DeleteAdvertisement_WhenExists_ShouldSucceed()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);
        _adRepo.GetByIdAsync(ad.Id, Arg.Any<CancellationToken>()).Returns(ad);

        var handler = new DeleteAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteAdvertisementCommand(ad.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        _adRepo.Received(1).Remove(ad);
    }

    [Fact]
    public async Task DeleteAdvertisement_WhenNotFound_ShouldFail()
    {
        _adRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Advertisement?)null);

        var handler = new DeleteAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new DeleteAdvertisementCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Contains("not found", result.Error!);
    }

    // === ToggleAdvertisement ===

    [Fact]
    public async Task ToggleAdvertisement_Activate_ShouldSetActive()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);
        ad.Deactivate();
        Assert.False(ad.IsActive);

        _adRepo.GetByIdAsync(ad.Id, Arg.Any<CancellationToken>()).Returns(ad);

        var handler = new ToggleAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new ToggleAdvertisementCommand(ad.Id, true), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(ad.IsActive);
    }

    [Fact]
    public async Task ToggleAdvertisement_Deactivate_ShouldSetInactive()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);
        Assert.True(ad.IsActive);

        _adRepo.GetByIdAsync(ad.Id, Arg.Any<CancellationToken>()).Returns(ad);

        var handler = new ToggleAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new ToggleAdvertisementCommand(ad.Id, false), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(ad.IsActive);
    }

    [Fact]
    public async Task ToggleAdvertisement_WhenNotFound_ShouldFail()
    {
        _adRepo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Advertisement?)null);

        var handler = new ToggleAdvertisementCommandHandler(_adRepo, _cacheService, _unitOfWork);
        var result = await handler.Handle(new ToggleAdvertisementCommand(Guid.NewGuid(), true), CancellationToken.None);

        Assert.False(result.IsSuccess);
    }
}
