using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;

namespace KurdMap.Tests.Domain;

public class ValueObjectTests
{
    // === MultilingualText ===

    [Fact]
    public void MultilingualText_Create_ShouldTrimValues()
    {
        var text = MultilingualText.Create("  ku  ", "  de  ", "  kmr  ", "  en  ");
        Assert.Equal("ku", text.Ku);
        Assert.Equal("de", text.De);
        Assert.Equal("kmr", text.Kmr);
        Assert.Equal("en", text.En);
    }

    [Fact]
    public void MultilingualText_GetLocalized_ShouldReturnCorrectLanguage()
    {
        var text = MultilingualText.Create("Kurdish", "German", "Kurmanji", "English");
        Assert.Equal("Kurdish", text.GetLocalized("ku"));
        Assert.Equal("Kurmanji", text.GetLocalized("kmr"));
        Assert.Equal("German", text.GetLocalized("de"));
        Assert.Equal("English", text.GetLocalized("en"));
        Assert.Equal("German", text.GetLocalized("unknown")); // default = De
    }

    // === Address ===

    [Fact]
    public void Address_Create_ShouldSetProperties()
    {
        var cityId = Guid.NewGuid();
        var address = Address.Create("Venloer Str. 1", "50672", cityId);
        Assert.Equal("Venloer Str. 1", address.Street);
        Assert.Equal("50672", address.PostalCode);
        Assert.Equal(cityId, address.CityId);
    }

    [Fact]
    public void Address_Create_WhenEmptyStreet_ShouldThrow()
    {
        Assert.Throws<DomainException>(() => Address.Create("", "50672", Guid.NewGuid()));
    }

    [Fact]
    public void Address_Create_WhenEmptyPostalCode_ShouldThrow()
    {
        Assert.Throws<DomainException>(() => Address.Create("Street 1", "", Guid.NewGuid()));
    }

    // === Coordinates ===

    [Fact]
    public void Coordinates_Create_ShouldSetValues()
    {
        var coords = Coordinates.Create(50.9375m, 6.9603m);
        Assert.Equal(50.9375m, coords.Latitude);
        Assert.Equal(6.9603m, coords.Longitude);
    }

    [Fact]
    public void Coordinates_Create_WhenLatOutOfRange_ShouldThrow()
    {
        Assert.Throws<DomainException>(() => Coordinates.Create(91m, 6m));
        Assert.Throws<DomainException>(() => Coordinates.Create(-91m, 6m));
    }

    [Fact]
    public void Coordinates_Create_WhenLngOutOfRange_ShouldThrow()
    {
        Assert.Throws<DomainException>(() => Coordinates.Create(50m, 181m));
        Assert.Throws<DomainException>(() => Coordinates.Create(50m, -181m));
    }
}
