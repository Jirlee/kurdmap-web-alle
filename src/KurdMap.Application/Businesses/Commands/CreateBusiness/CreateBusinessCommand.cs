using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.CreateBusiness;

public sealed record CreateBusinessCommand(
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
