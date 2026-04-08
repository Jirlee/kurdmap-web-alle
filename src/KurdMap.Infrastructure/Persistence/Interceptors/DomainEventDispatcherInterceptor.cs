using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace KurdMap.Infrastructure.Persistence.Interceptors;

public sealed class DomainEventDispatcherInterceptor(IPublisher publisher) : SaveChangesInterceptor
{
    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            await DispatchDomainEventsAsync(eventData.Context, cancellationToken);

        return result;
    }

    private async Task DispatchDomainEventsAsync(DbContext context, CancellationToken ct)
    {
        var entities = context.ChangeTracker
            .Entries<Business>()
            .Where(e => e.Entity.DomainEvents.Count != 0)
            .Select(e => e.Entity)
            .ToList();

        var domainEvents = entities.SelectMany(e => e.DomainEvents).ToList();

        foreach (var entity in entities)
            entity.ClearDomainEvents();

        foreach (var domainEvent in domainEvents)
        {
            // Wrap domain event in MediatR notification
            var notificationType = typeof(DomainEventNotification<>).MakeGenericType(domainEvent.GetType());
            var notification = Activator.CreateInstance(notificationType, domainEvent)!;
            await publisher.Publish(notification, ct);
        }
    }
}
