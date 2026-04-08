using KurdMap.Domain.Users.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "SuperAdmin,Admin")]
[EnableRateLimiting("fixed")]
public class UsersController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    /// <summary>
    /// Get paginated list of users with optional search and role filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        CancellationToken ct = default)
    {
        var query = userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(term) ||
                u.FullName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            if (!string.IsNullOrWhiteSpace(role) && !roles.Contains(role))
                continue;

            items.Add(MapToDto(user, roles));
        }

        // Adjust total if role filter applied (approximate since we filter in-memory)
        if (!string.IsNullOrWhiteSpace(role))
            totalCount = items.Count;

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return Ok(new UserListResponse(
            items,
            pageNumber,
            totalPages,
            totalCount,
            pageNumber > 1,
            pageNumber < totalPages));
    }

    /// <summary>
    /// Get a single user by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 404, detail: "User not found."));

        var roles = await userManager.GetRolesAsync(user);
        return Ok(MapToDto(user, roles));
    }

    /// <summary>
    /// Update a user's role.
    /// </summary>
    [HttpPut("{id:guid}/role")]
    [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 404, detail: "User not found."));

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, request.Role);

        var newRoles = await userManager.GetRolesAsync(user);
        return Ok(MapToDto(user, newRoles));
    }

    /// <summary>
    /// Activate or deactivate a user.
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(ProblemDetailsFactory.CreateProblemDetails(HttpContext, 404, detail: "User not found."));

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        return Ok(MapToDto(user, roles));
    }

    private static UserDto MapToDto(ApplicationUser user, IList<string> roles) => new(
        user.Id,
        user.Email ?? string.Empty,
        user.FullName,
        roles.ToList(),
        user.IsActive,
        user.EmailConfirmed,
        user.CreatedAt,
        user.UpdatedAt);
}

public sealed record UserDto(
    Guid Id,
    string Email,
    string FullName,
    List<string> Roles,
    bool IsActive,
    bool EmailConfirmed,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserListResponse(
    List<UserDto> Items,
    int PageNumber,
    int TotalPages,
    int TotalCount,
    bool HasPreviousPage,
    bool HasNextPage);

public sealed record ChangeRoleRequest(string Role);

public sealed record ChangeStatusRequest(bool IsActive);
