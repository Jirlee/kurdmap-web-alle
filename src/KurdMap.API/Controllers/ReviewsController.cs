using KurdMap.Application.Common.Interfaces;
using KurdMap.Application.Reviews.Commands.ApproveReview;
using KurdMap.Application.Reviews.Commands.CreateReview;
using KurdMap.Application.Reviews.Commands.DeleteReview;
using KurdMap.Application.Reviews.DTOs;
using KurdMap.Application.Reviews.Queries.GetAllReviews;
using KurdMap.Application.Reviews.Queries.GetReviews;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/reviews")]
[EnableRateLimiting("fixed")]
public class ReviewsController(ISender sender, ICurrentUserService currentUser) : BaseApiController
{
    [HttpGet("business/{businessId:guid}")]
    [ProducesResponseType(typeof(List<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByBusiness(Guid businessId, CancellationToken ct)
        => OkOrBadRequest(await sender.Send(new GetReviewsByBusinessQuery(businessId), ct));

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Moderator")]
    [ProducesResponseType(typeof(List<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool? approvedOnly, CancellationToken ct)
        => OkOrBadRequest(await sender.Send(new GetAllReviewsQuery(approvedOnly), ct));

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateReviewCommand command, CancellationToken ct)
    {
        // Never trust a client-supplied user id — bind the review to the caller.
        if (currentUser.UserId is not { } uid)
            return Unauthorized();

        return CreatedOrBadRequest(await sender.Send(command with { UserId = uid }, ct));
    }

    [HttpPut("{id:guid}/approve")]
    [Authorize(Roles = "SuperAdmin,Admin,Moderator")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new ApproveReviewCommand(id), ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Moderator")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrNotFound(await sender.Send(new DeleteReviewCommand(id), ct));
}
