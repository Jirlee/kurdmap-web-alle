using MediatR;
using Microsoft.Extensions.Logging;

namespace KurdMap.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        logger.LogInformation("KurdMap Request: {Name} {@Request}", requestName, request);

        var response = await next(cancellationToken);

        logger.LogInformation("KurdMap Response: {Name} {@Response}", requestName, response);

        return response;
    }
}
