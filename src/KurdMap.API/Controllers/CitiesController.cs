using KurdMap.Application.Cities.Commands.CreateCity;
using KurdMap.Application.Cities.Commands.DeleteCity;
using KurdMap.Application.Cities.Commands.UpdateCity;
using KurdMap.Application.Cities.DTOs;
using KurdMap.Application.Cities.Queries.GetCities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/cities")]
[EnableRateLimiting("fixed")]
public class CitiesController(ISender sender) : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<CityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetCitiesQuery(), ct);
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(CityDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCityCommand command, CancellationToken ct)
        => CreatedOrBadRequest(await sender.Send(command, ct), nameof(GetAll));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(CityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCityCommand command, CancellationToken ct)
    {
        var mismatch = ValidateRouteId(id, command.Id);
        if (mismatch is not null) return mismatch;
        return OkOrNotFound(await sender.Send(command, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteCityCommand(id), ct));
}
