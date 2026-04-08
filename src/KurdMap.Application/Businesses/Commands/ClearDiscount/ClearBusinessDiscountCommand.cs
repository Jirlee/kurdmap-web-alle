using KurdMap.Application.Common.Models;
using MediatR;

namespace KurdMap.Application.Businesses.Commands.ClearDiscount;

public sealed record ClearBusinessDiscountCommand(Guid Id) : IRequest<Result>;
