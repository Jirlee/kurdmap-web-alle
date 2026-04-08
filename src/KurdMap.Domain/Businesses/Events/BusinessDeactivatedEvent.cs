using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Events;

public sealed record BusinessDeactivatedEvent(Guid BusinessId) : IDomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}
