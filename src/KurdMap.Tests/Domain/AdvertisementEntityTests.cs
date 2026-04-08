using KurdMap.Domain.Advertisements.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Tests.Domain;

public class AdvertisementTests
{
    [Fact]
    public void Create_WhenValid_ShouldSetDefaults()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);

        Assert.True(ad.IsActive);
        Assert.NotEqual(Guid.Empty, ad.Id);
    }

    [Fact]
    public void Create_WhenEndBeforeStart_ShouldThrow()
    {
        Assert.Throws<DomainException>(() =>
            Advertisement.Create(
                MultilingualText.Create("ku", "de"), null,
                "https://img.test/ad.jpg", null, null,
                DateTime.UtcNow.AddDays(7), DateTime.UtcNow, 1));
    }

    [Fact]
    public void Activate_ShouldSetIsActive()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);
        ad.Deactivate();
        Assert.False(ad.IsActive);
        ad.Activate();
        Assert.True(ad.IsActive);
    }

    [Fact]
    public void IsCurrentlyRunning_WhenActiveAndInRange_ShouldReturnTrue()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(7), 1);

        Assert.True(ad.IsCurrentlyRunning);
    }

    [Fact]
    public void IsCurrentlyRunning_WhenInactiveOrOutOfRange_ShouldReturnFalse()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(7), 1);

        Assert.False(ad.IsCurrentlyRunning); // future start date

        var ad2 = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(7), 1);
        ad2.Deactivate();
        Assert.False(ad2.IsCurrentlyRunning); // inactive
    }

    [Fact]
    public void Update_WhenEndBeforeStart_ShouldThrow()
    {
        var ad = Advertisement.Create(
            MultilingualText.Create("ku", "de"), null,
            "https://img.test/ad.jpg", null, null,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7), 1);

        Assert.Throws<DomainException>(() =>
            ad.Update(MultilingualText.Create("ku", "de"), null,
                "https://img.test/ad.jpg", null,
                DateTime.UtcNow.AddDays(7), DateTime.UtcNow, 1));
    }
}
