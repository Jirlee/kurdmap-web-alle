using KurdMap.Application.Businesses.Commands.CreateMenuItem;
using KurdMap.Application.Businesses.Commands.DeleteMenuItem;
using KurdMap.Application.Businesses.Commands.CreateBusinessService;
using KurdMap.Application.Businesses.Commands.DeleteBusinessService;
using KurdMap.Application.Businesses.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/businesses/{businessId:guid}")]
[EnableRateLimiting("fixed")]
[Authorize]
public class BusinessChildrenController(ISender sender) : BaseApiController
{
    [HttpPost("menu-items")]
    [ProducesResponseType(typeof(MenuItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateMenuItem(Guid businessId, [FromBody] CreateMenuItemRequest body, CancellationToken ct)
    {
        var command = new CreateMenuItemCommand(businessId, body.Name, body.Description, body.Price, body.ImageUrl, body.SortOrder);
        return CreatedOrBadRequest(await sender.Send(command, ct));
    }

    [HttpDelete("menu-items/{menuItemId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMenuItem(Guid businessId, Guid menuItemId, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteMenuItemCommand(businessId, menuItemId), ct));

    [HttpPost("services")]
    [ProducesResponseType(typeof(BusinessServiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateService(Guid businessId, [FromBody] CreateBusinessServiceRequest body, CancellationToken ct)
    {
        var command = new CreateBusinessServiceCommand(businessId, body.Name, body.Description, body.Price, body.SortOrder);
        return CreatedOrBadRequest(await sender.Send(command, ct));
    }

    [HttpDelete("services/{serviceId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteService(Guid businessId, Guid serviceId, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteBusinessServiceCommand(businessId, serviceId), ct));
}

// Request DTOs (separate from Commands to avoid BusinessId in body)
public sealed record CreateMenuItemRequest(
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    string? ImageUrl,
    int SortOrder);

public sealed record CreateBusinessServiceRequest(
    MultilingualTextDto Name,
    MultilingualTextDto? Description,
    decimal? Price,
    int SortOrder);
