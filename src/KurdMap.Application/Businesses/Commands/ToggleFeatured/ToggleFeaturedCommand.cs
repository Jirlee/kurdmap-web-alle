using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.ToggleFeatured;

public sealed record ToggleFeaturedCommand(Guid Id) : IRequest<Result>;
