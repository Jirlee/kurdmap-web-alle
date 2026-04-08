using FluentValidation;

namespace KurdMap.Application.Businesses.Commands.SetDiscount;

public sealed class SetBusinessDiscountCommandValidator : AbstractValidator<SetBusinessDiscountCommand>
{
    public SetBusinessDiscountCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Percentage).InclusiveBetween(1, 100)
            .WithMessage("Discount percentage must be between 1 and 100.");
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("End date must be after start date.");
    }
}
