using System.Net;
using System.Text.Json;
using KurdMap.Application.Common.Exceptions;
using KurdMap.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace KurdMap.API.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            ValidationException => (HttpStatusCode.BadRequest, "Validation Error"),
            NotFoundException => (HttpStatusCode.NotFound, "Not Found"),
            ForbiddenAccessException => (HttpStatusCode.Forbidden, "Forbidden"),
            DomainException => (HttpStatusCode.BadRequest, "Domain Error"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized"),
            _ => (HttpStatusCode.InternalServerError, "Server Error")
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            logger.LogError(exception, "Unhandled exception");
        else
            logger.LogWarning(exception, "Handled exception: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = statusCode == HttpStatusCode.InternalServerError
                ? "An unexpected error occurred."
                : exception.Message,
            Instance = context.Request.Path
        };

        if (exception is ValidationException validationEx)
            problemDetails.Extensions["errors"] = validationEx.Errors;

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
}
