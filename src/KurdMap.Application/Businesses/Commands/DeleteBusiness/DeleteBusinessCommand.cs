using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.DeleteBusiness;

public sealed record DeleteBusinessCommand(Guid Id) : IRequest<Result>;
