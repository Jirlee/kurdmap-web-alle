using KurdMap.Domain.Common;
using MediatR;

namespace KurdMap.Application.Common.Models;

public sealed class DomainEventNotification<TEvent>(TEvent domainEvent) : INotification
    where TEvent : IDomainEvent
{
    public TEvent DomainEvent { get; } = domainEvent;
}
