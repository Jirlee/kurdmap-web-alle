using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.ValueObjects;

public sealed record Coordinates
{
    public decimal Latitude { get; init; }
    public decimal Longitude { get; init; }

    private Coordinates() { }

    public static Coordinates Create(decimal latitude, decimal longitude)
    {
        if (latitude < -90 || latitude > 90)
            throw new DomainException("Latitude must be between -90 and 90");
        if (longitude < -180 || longitude > 180)
            throw new DomainException("Longitude must be between -180 and 180");

        return new Coordinates { Latitude = latitude, Longitude = longitude };
    }
}
