using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.VerifyBusiness;

public sealed record VerifyBusinessCommand(Guid Id) : IRequest<Result>;
