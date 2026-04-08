using KurdMap.Application.Businesses.DTOs;
using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Queries.GetBusinessBySlug;

public sealed record GetBusinessBySlugQuery(string Slug) : IRequest<Result<BusinessDetailDto>>;
