using KurdMap.Application.Businesses.Commands.DeleteBusinessImage;
using KurdMap.Application.Businesses.Commands.SetPrimaryImage;
using KurdMap.Application.Businesses.Commands.UploadBusinessImage;
using KurdMap.Application.Businesses.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/businesses/{businessId:guid}/images")]
[Authorize]
[EnableRateLimiting("upload")]
public class ImagesController(ISender sender) : BaseApiController
{
    [HttpPost]
    [ProducesResponseType(typeof(BusinessImageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        Guid businessId,
        IFormFile file,
        [FromForm] string? altText = null,
        [FromForm] bool isPrimary = false,
        CancellationToken ct = default)
    {
        if (file.Length == 0)
            return BadRequest(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 400, detail: "File is empty."));

        await using var stream = file.OpenReadStream();
        var command = new UploadBusinessImageCommand(businessId, stream, file.FileName, file.Length, altText, isPrimary);
        var result = await sender.Send(command, ct);
        return CreatedOrBadRequest(result, null, result.IsSuccess ? new { businessId, imageId = result.Value!.Id } : null);
    }

    [HttpDelete("{imageId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid businessId, Guid imageId, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteBusinessImageCommand(businessId, imageId), ct));

    [HttpPut("{imageId:guid}/primary")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetPrimary(Guid businessId, Guid imageId, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new SetPrimaryImageCommand(businessId, imageId), ct));
}
