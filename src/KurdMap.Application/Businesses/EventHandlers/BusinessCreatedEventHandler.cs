using KurdMap.Application.Common.Models;
using KurdMap.Domain.Businesses.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace KurdMap.Application.Businesses.EventHandlers;

public sealed class BusinessCreatedEventHandler(
    ILogger<BusinessCreatedEventHandler> logger)
    : INotificationHandler<DomainEventNotification<BusinessCreatedEvent>>
{
    public Task Handle(DomainEventNotification<BusinessCreatedEvent> notification, CancellationToken ct)
    {
        logger.LogInformation("Business created: {BusinessId}", notification.DomainEvent.BusinessId);

        // Future: send notification email, update search index, etc.
        return Task.CompletedTask;
    }
}
