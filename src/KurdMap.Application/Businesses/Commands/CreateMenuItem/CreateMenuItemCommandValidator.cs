using FluentValidation;

namespace KurdMap.Application.Businesses.Commands.CreateMenuItem;

public sealed class CreateMenuItemCommandValidator : AbstractValidator<CreateMenuItemCommand>
{
    public CreateMenuItemCommandValidator()
    {
        RuleFor(x => x.BusinessId).NotEmpty();
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Name.Ku).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Name.De).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.ImageUrl).MaximumLength(1000);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
