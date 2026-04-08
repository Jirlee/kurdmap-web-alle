using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.ValueObjects;

public sealed record Address
{
    public string Street { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public Guid CityId { get; init; }

    private Address() { }

    public static Address Create(string street, string postalCode, Guid cityId)
    {
        if (string.IsNullOrWhiteSpace(street))
            throw new DomainException("Street is required");
        if (string.IsNullOrWhiteSpace(postalCode))
            throw new DomainException("Postal code is required");

        return new Address
        {
            Street = street.Trim(),
            PostalCode = postalCode.Trim(),
            CityId = cityId
        };
    }
}
