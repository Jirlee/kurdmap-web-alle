using System.Threading.RateLimiting;
using KurdMap.Application.ContactMessages.Commands.SubmitContactMessage;
using KurdMap.Application.ContactMessages.Queries.GetContactMessages;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/contact")]
[EnableRateLimiting("fixed")]
public class ContactController(ISender sender) : BaseApiController
{
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit([FromBody] SubmitContactMessageCommand command, CancellationToken ct)
        => CreatedOrBadRequest(await sender.Send(command, ct));

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => OkOrBadRequest(await sender.Send(new GetContactMessagesQuery(), ct));
}
