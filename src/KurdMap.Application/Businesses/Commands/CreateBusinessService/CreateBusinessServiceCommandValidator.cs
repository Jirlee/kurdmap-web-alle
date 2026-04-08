using FluentValidation;

namespace KurdMap.Application.Businesses.Commands.CreateBusinessService;

public sealed class CreateBusinessServiceCommandValidator : AbstractValidator<CreateBusinessServiceCommand>
{
    public CreateBusinessServiceCommandValidator()
    {
        RuleFor(x => x.BusinessId).NotEmpty();
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Name.Ku).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Name.De).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
