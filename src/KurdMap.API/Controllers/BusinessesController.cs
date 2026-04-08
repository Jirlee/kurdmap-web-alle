using KurdMap.Application.Businesses.Commands.ClearDiscount;
using KurdMap.Application.Businesses.Commands.CreateBusiness;
using KurdMap.Application.Businesses.Commands.DeleteBusiness;
using KurdMap.Application.Businesses.Commands.SetDiscount;
using KurdMap.Application.Businesses.Commands.ToggleFeatured;
using KurdMap.Application.Businesses.Commands.UpdateBusiness;
using KurdMap.Application.Businesses.Commands.VerifyBusiness;
using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Businesses.Queries.GetBusinessBySlug;
using KurdMap.Application.Businesses.Queries.GetBusinessesList;
using KurdMap.Application.Businesses.Queries.GetRecommendedBusinesses;
using KurdMap.Application.Businesses.Queries.SearchBusinesses;
using KurdMap.Application.Common.Models;
using KurdMap.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/businesses")]
[EnableRateLimiting("fixed")]
public class BusinessesController(ISender sender) : BaseApiController
{
    /// <summary>
    /// Search businesses with full-text search, city/category slug filters, location, and sorting.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PaginatedList<BusinessSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? search = null,
        [FromQuery] string? city = null,
        [FromQuery] string? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] BusinessSortOption sort = BusinessSortOption.Relevance,
        [FromQuery] double? latitude = null,
        [FromQuery] double? longitude = null,
        [FromQuery] double? radiusKm = null,
        CancellationToken ct = default)
    {
        var query = new SearchBusinessesQuery(search, city, category, page, pageSize, sort, latitude, longitude, radiusKm);
        return OkOrBadRequest(await sender.Send(query, ct));
    }

    /// <summary>
    /// Get paginated list of businesses with optional filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedList<BusinessSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] Guid? cityId = null,
        [FromQuery] BusinessStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        return OkOrBadRequest(await sender.Send(
            new GetBusinessesListQuery(pageNumber, pageSize, categoryId, cityId, status, search), ct));
    }

    /// <summary>
    /// Get a single business by its slug.
    /// </summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(BusinessDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
        => OkOrNotFound(await sender.Send(new GetBusinessBySlugQuery(slug), ct));

    /// <summary>
    /// Create a new business listing.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BusinessDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateBusinessCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return CreatedOrBadRequest(result, nameof(GetBySlug), result.IsSuccess ? new { slug = result.Value!.Slug } : null);
    }

    /// <summary>
    /// Update an existing business.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(BusinessDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBusinessCommand command, CancellationToken ct)
    {
        var mismatch = ValidateRouteId(id, command.Id);
        if (mismatch is not null) return mismatch;

        return OkOrNotFound(await sender.Send(command, ct));
    }

    /// <summary>
    /// Soft-delete a business (sets status to Deactivated).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteBusinessCommand(id), ct));

    /// <summary>
    /// Verify a business (admin/moderator action).
    /// </summary>
    [HttpPost("{id:guid}/verify")]
    [Authorize(Roles = "SuperAdmin,Admin,Moderator")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Verify(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new VerifyBusinessCommand(id), ct));

    /// <summary>
    /// Toggle whether a business is featured/suggested in search results.
    /// </summary>
    [HttpPost("{id:guid}/toggle-featured")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleFeatured(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new ToggleFeaturedCommand(id), ct));

    /// <summary>
    /// Set a discount/promotion on a business.
    /// </summary>
    [HttpPost("{id:guid}/discount")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDiscount(Guid id, [FromBody] SetBusinessDiscountCommand command, CancellationToken ct)
    {
        var mismatch = ValidateRouteId(id, command.Id);
        if (mismatch is not null) return mismatch;

        return NoContentOrNotFound(await sender.Send(command, ct));
    }

    /// <summary>
    /// Remove discount/promotion from a business.
    /// </summary>
    [HttpDelete("{id:guid}/discount")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ClearDiscount(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new ClearBusinessDiscountCommand(id), ct));

    /// <summary>
    /// Get recommended businesses (featured + active discounts).
    /// </summary>
    [HttpGet("recommended")]
    [ProducesResponseType(typeof(RecommendedBusinessesDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecommended([FromQuery] int count = 12, CancellationToken ct = default)
        => OkOrBadRequest(await sender.Send(new GetRecommendedBusinessesQuery(count), ct));
}
