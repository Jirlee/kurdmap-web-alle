using KurdMap.Application.Categories.Commands.CreateCategory;
using KurdMap.Application.Categories.Commands.DeleteCategory;
using KurdMap.Application.Categories.Commands.UpdateCategory;
using KurdMap.Application.Categories.DTOs;
using KurdMap.Application.Categories.Queries.GetCategories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/categories")]
[EnableRateLimiting("fixed")]
public class CategoriesController(ISender sender) : BaseApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetCategoriesQuery(), ct);
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryCommand command, CancellationToken ct)
        => CreatedOrBadRequest(await sender.Send(command, ct), nameof(GetAll));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken ct)
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
        => NoContentOrNotFound(await sender.Send(new DeleteCategoryCommand(id), ct));
}
