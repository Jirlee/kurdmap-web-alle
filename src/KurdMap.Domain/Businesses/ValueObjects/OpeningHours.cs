namespace KurdMap.Domain.Businesses.ValueObjects;

public sealed record DaySchedule(string? Open, string? Close, bool Closed);

public sealed record OpeningHours
{
    public DaySchedule Monday { get; init; } = new(null, null, true);
    public DaySchedule Tuesday { get; init; } = new(null, null, true);
    public DaySchedule Wednesday { get; init; } = new(null, null, true);
    public DaySchedule Thursday { get; init; } = new(null, null, true);
    public DaySchedule Friday { get; init; } = new(null, null, true);
    public DaySchedule Saturday { get; init; } = new(null, null, true);
    public DaySchedule Sunday { get; init; } = new(null, null, true);
}
