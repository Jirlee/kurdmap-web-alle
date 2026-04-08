using KurdMap.Domain.Common;

namespace KurdMap.Domain.Businesses.Events;

public sealed record BusinessCreatedEvent(Guid BusinessId) : IDomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}
