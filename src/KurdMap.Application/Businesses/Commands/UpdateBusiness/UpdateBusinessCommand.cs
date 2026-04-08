using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.UpdateBusiness;

public sealed record UpdateBusinessCommand(
    Guid Id,
    MultilingualTextDto Name,
    MultilingualTextDto Description,
    Guid CategoryId,
    string Street,
    string PostalCode,
    Guid CityId,
    decimal Latitude,
    decimal Longitude,
    string? Phone,
    string? Email,
    string? Website) : IRequest<Result<BusinessDetailDto>>;
