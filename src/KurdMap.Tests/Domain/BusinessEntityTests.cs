using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using KurdMap.Domain.Enums;

namespace KurdMap.Tests.Domain;

public class BusinessTests
{
    private static Business CreateTestBusiness() => Business.Create(
        MultilingualText.Create("چێشتخانە", "Restaurant"),
        "test-restaurant",
        MultilingualText.Create("باشترین چێشتخانە", "Bestes Restaurant"),
        Guid.NewGuid(),
        Address.Create("Venloer Str. 1", "50672", Guid.NewGuid()),
        Coordinates.Create(50.9375m, 6.9603m));

    [Fact]
    public void Create_ShouldSetDefaultStatusPending()
    {
        var business = CreateTestBusiness();
        Assert.Equal(BusinessStatus.Pending, business.Status);
        Assert.False(business.IsVerified);
    }

    [Fact]
    public void Create_ShouldGenerateUniqueId()
    {
        var b1 = CreateTestBusiness();
        var b2 = CreateTestBusiness();
        Assert.NotEqual(b1.Id, b2.Id);
    }

    [Fact]
    public void Create_ShouldSetSlugToLowerInvariant()
    {
        var business = Business.Create(
            MultilingualText.Create("ku", "de"), "My-SLUG-Test",
            MultilingualText.Create("ku", "de"),
            Guid.NewGuid(), Address.Create("St", "50667", Guid.NewGuid()),
            Coordinates.Create(50m, 6m));

        Assert.Equal("my-slug-test", business.Slug);
    }

    [Fact]
    public void Create_ShouldRaiseDomainEvent()
    {
        var business = CreateTestBusiness();
        Assert.Single(business.DomainEvents);
    }

    [Fact]
    public void Verify_ShouldSetVerifiedAndActive()
    {
        var business = CreateTestBusiness();
        business.Verify();
        Assert.True(business.IsVerified);
        Assert.Equal(BusinessStatus.Active, business.Status);
    }

    [Fact]
    public void Verify_WhenAlreadyVerified_ShouldNotRaiseEvent()
    {
        var business = CreateTestBusiness();
        business.ClearDomainEvents();
        business.Verify();
        Assert.Single(business.DomainEvents);
        business.Verify(); // second call — no new event
        Assert.Single(business.DomainEvents);
    }

    [Fact]
    public void Deactivate_ShouldSetStatusDeactivated()
    {
        var business = CreateTestBusiness();
        business.Deactivate();
        Assert.Equal(BusinessStatus.Deactivated, business.Status);
    }

    [Fact]
    public void SoftDelete_ShouldSetStatusDeactivated()
    {
        var business = CreateTestBusiness();
        business.SoftDelete();
        Assert.Equal(BusinessStatus.Deactivated, business.Status);
    }

    [Fact]
    public void SetContact_ShouldUpdateFields()
    {
        var business = CreateTestBusiness();
        business.SetContact("0221-123", "test@test.de", "https://test.de");
        Assert.Equal("0221-123", business.Phone);
        Assert.Equal("test@test.de", business.Email);
        Assert.Equal("https://test.de", business.Website);
    }

    [Fact]
    public void SetOwner_ShouldUpdateOwnerId()
    {
        var business = CreateTestBusiness();
        var ownerId = Guid.NewGuid();
        business.SetOwner(ownerId);
        Assert.Equal(ownerId, business.OwnerId);
    }

    [Fact]
    public void AddImage_ShouldAddToCollection()
    {
        var business = CreateTestBusiness();
        business.AddImage("https://img.test/1.jpg", "Alt text", true);
        Assert.Single(business.Images);
        Assert.True(business.Images.First().IsPrimary);
    }

    [Fact]
    public void AddImage_PrimaryImage_ShouldUnsetPreviousPrimary()
    {
        var business = CreateTestBusiness();
        business.AddImage("https://img.test/1.jpg", null, true);
        business.AddImage("https://img.test/2.jpg", null, true);
        Assert.Equal(2, business.Images.Count);
        Assert.Single(business.Images, i => i.IsPrimary);
    }

    [Fact]
    public void RemoveImage_ShouldRemoveFromCollection()
    {
        var business = CreateTestBusiness();
        business.AddImage("https://img.test/1.jpg", null, false);
        var imageId = business.Images.First().Id;
        business.RemoveImage(imageId);
        Assert.Empty(business.Images);
    }

    [Fact]
    public void Update_ShouldChangeFields()
    {
        var business = CreateTestBusiness();
        var newName = MultilingualText.Create("nwê", "Neu");
        var newDesc = MultilingualText.Create("nwê", "Neu");
        var newCatId = Guid.NewGuid();
        var newAddr = Address.Create("New St", "50000", Guid.NewGuid());
        var newLoc = Coordinates.Create(51m, 7m);

        business.Update(newName, newDesc, newCatId, newAddr, newLoc);

        Assert.Equal("nwê", business.Name.Ku);
        Assert.Equal(newCatId, business.CategoryId);
        Assert.Equal(51m, business.Location.Latitude);
    }

    // ── Discount tests ──

    [Fact]
    public void SetDiscount_ShouldSetAllFields()
    {
        var business = CreateTestBusiness();
        var desc = MultilingualText.Create("داشکاندن", "Rabatt");
        var start = DateTime.UtcNow;
        var end = start.AddDays(7);

        business.SetDiscount(25, desc, start, end);

        Assert.Equal(25, business.DiscountPercentage);
        Assert.Equal("داشکاندن", business.DiscountDescription!.Ku);
        Assert.Equal(start, business.DiscountStartDate);
        Assert.Equal(end, business.DiscountEndDate);
        Assert.True(business.HasActiveDiscount);
    }

    [Fact]
    public void SetDiscount_WithoutDates_ShouldBeActive()
    {
        var business = CreateTestBusiness();
        business.SetDiscount(10, null, null, null);

        Assert.Equal(10, business.DiscountPercentage);
        Assert.True(business.HasActiveDiscount);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(101)]
    public void SetDiscount_InvalidPercentage_ShouldThrow(int percentage)
    {
        var business = CreateTestBusiness();
        Assert.Throws<DomainException>(() => business.SetDiscount(percentage, null, null, null));
    }

    [Fact]
    public void SetDiscount_EndBeforeStart_ShouldThrow()
    {
        var business = CreateTestBusiness();
        var start = DateTime.UtcNow;
        var end = start.AddDays(-1);

        Assert.Throws<DomainException>(() => business.SetDiscount(15, null, start, end));
    }

    [Fact]
    public void ClearDiscount_ShouldNullAllFields()
    {
        var business = CreateTestBusiness();
        business.SetDiscount(50, MultilingualText.Create("ku", "de"), DateTime.UtcNow, DateTime.UtcNow.AddDays(7));
        Assert.True(business.HasActiveDiscount);

        business.ClearDiscount();

        Assert.Null(business.DiscountPercentage);
        Assert.Null(business.DiscountDescription);
        Assert.Null(business.DiscountStartDate);
        Assert.Null(business.DiscountEndDate);
        Assert.False(business.HasActiveDiscount);
    }

    [Fact]
    public void HasActiveDiscount_PastEndDate_ShouldBeFalse()
    {
        var business = CreateTestBusiness();
        business.SetDiscount(20, null, DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(-1));

        Assert.False(business.HasActiveDiscount);
    }

    [Fact]
    public void HasActiveDiscount_FutureStartDate_ShouldBeFalse()
    {
        var business = CreateTestBusiness();
        business.SetDiscount(20, null, DateTime.UtcNow.AddDays(5), DateTime.UtcNow.AddDays(10));

        Assert.False(business.HasActiveDiscount);
    }
}
