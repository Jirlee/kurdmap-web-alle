using KurdMap.Application.Advertisements.Commands.CreateAdvertisement;
using KurdMap.Application.Advertisements.Commands.DeleteAdvertisement;
using KurdMap.Application.Advertisements.Commands.ToggleAdvertisement;
using KurdMap.Application.Advertisements.Commands.UpdateAdvertisement;
using KurdMap.Application.Advertisements.DTOs;
using KurdMap.Application.Advertisements.Queries.GetAdvertisements;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/advertisements")]
[EnableRateLimiting("fixed")]
public class AdvertisementsController(ISender sender) : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<AdvertisementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly, CancellationToken ct)
        => OkOrBadRequest(await sender.Send(new GetAdvertisementsQuery(activeOnly), ct));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(AdvertisementDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateAdvertisementCommand command, CancellationToken ct)
        => CreatedOrBadRequest(await sender.Send(command, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(AdvertisementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAdvertisementCommand command, CancellationToken ct)
    {
        var mismatch = ValidateRouteId(id, command.Id);
        if (mismatch is not null) return mismatch;
        return OkOrNotFound(await sender.Send(command, ct));
    }

    [HttpPut("{id:guid}/toggle")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle(Guid id, [FromBody] ToggleAdvertisementCommand command, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(command with { Id = id }, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteAdvertisementCommand(id), ct));
}
