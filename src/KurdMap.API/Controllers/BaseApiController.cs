using KurdMap.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace KurdMap.API.Controllers;

/// <summary>
/// Base controller providing reusable Result-to-IActionResult helpers.
/// Eliminates repeated boilerplate across all CQRS-backed controllers.
/// </summary>
[ApiController]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Returns 200 OK with value, or 400 BadRequest with problem details.
    /// </summary>
    protected IActionResult OkOrBadRequest<T>(Result<T> result)
        => result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 400, detail: result.Error));

    /// <summary>
    /// Returns 200 OK with value, or 404 NotFound with problem details.
    /// </summary>
    protected IActionResult OkOrNotFound<T>(Result<T> result)
        => result.IsSuccess
            ? Ok(result.Value)
            : NotFound(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 404, detail: result.Error));

    /// <summary>
    /// Returns 201 Created with value, or 400 BadRequest with problem details.
    /// </summary>
    protected IActionResult CreatedOrBadRequest<T>(Result<T> result, string? actionName = null, object? routeValues = null)
        => result.IsSuccess
            ? actionName is not null
                ? CreatedAtAction(actionName, routeValues, result.Value)
                : Created(string.Empty, result.Value)
            : BadRequest(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 400, detail: result.Error));

    /// <summary>
    /// Returns 204 NoContent, or 404 NotFound with problem details.
    /// </summary>
    protected IActionResult NoContentOrNotFound(Result result)
        => result.IsSuccess
            ? NoContent()
            : NotFound(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 404, detail: result.Error));

    /// <summary>
    /// Validates that route ID matches body ID. Returns BadRequest if mismatch.
    /// </summary>
    protected IActionResult? ValidateRouteId(Guid routeId, Guid bodyId)
        => routeId != bodyId
            ? BadRequest(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 400, detail: "Route ID and body ID do not match."))
            : null;
}
