using KurdMap.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KurdMap.Application.Categories.DTOs;
using KurdMap.Application.Cities.DTOs;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Enums;
using BusinessSummaryDto = KurdMap.Shared.BusinessSummaryDto;
using MultilingualTextDto = KurdMap.Shared.MultilingualTextDto;
using KurdMap.Infrastructure.Persistence;

namespace KurdMap.API.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class DashboardController(
    AppDbContext db
) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {

        var totalBusinesses = await db.Businesses.CountAsync();
        var activeBusinesses = await db.Businesses.CountAsync(b => b.Status == BusinessStatus.Active);
        var pendingBusinesses = await db.Businesses.CountAsync(b => b.Status == BusinessStatus.Pending);
        var rejectedBusinesses = await db.Businesses.CountAsync(b => b.Status == BusinessStatus.Rejected);
        var deactivatedBusinesses = await db.Businesses.CountAsync(b => b.Status == BusinessStatus.Deactivated);
        var totalCategories = await db.Categories.CountAsync();
        var totalCities = await db.Cities.CountAsync();
        var recentBusinesses = await db.Businesses
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .Select(b => new BusinessSummaryDto(
                b.Id,
                b.Slug,
                new MultilingualTextDto(b.Name.Ku, b.Name.Kmr, b.Name.De, b.Name.En),
                b.CategoryId,
                null,
                b.Address.Street,
                b.Address.PostalCode,
                b.Location.Latitude,
                b.Location.Longitude,
                b.Phone,
                b.Status,
                b.IsVerified,
                b.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault() ?? b.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            ))
            .ToListAsync();

        var dto = new DashboardStatsDto
        {
            TotalBusinesses = totalBusinesses,
            ActiveBusinesses = activeBusinesses,
            PendingBusinesses = pendingBusinesses,
            RejectedBusinesses = rejectedBusinesses,
            DeactivatedBusinesses = deactivatedBusinesses,
            TotalCategories = totalCategories,
            TotalCities = totalCities,
            RecentBusinesses = recentBusinesses
        };
        return Ok(dto);
    }
}
