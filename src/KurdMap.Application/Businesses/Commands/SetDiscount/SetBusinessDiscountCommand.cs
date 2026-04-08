using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.SetDiscount;

public sealed record SetBusinessDiscountCommand(
    Guid Id,
    int Percentage,
    MultilingualTextDto? Description = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null) : IRequest<Result>;
