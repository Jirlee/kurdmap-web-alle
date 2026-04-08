using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Events;

public sealed record BusinessVerifiedEvent(Guid BusinessId) : IDomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}
