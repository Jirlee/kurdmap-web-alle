using FluentValidation;

namespace KurdMap.Application.Advertisements.Commands.CreateAdvertisement;

public sealed class CreateAdvertisementCommandValidator : AbstractValidator<CreateAdvertisementCommand>
{
    public CreateAdvertisementCommandValidator()
    {
        RuleFor(x => x.Title).NotNull();
        RuleFor(x => x.Title.Ku).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Title.De).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(500);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).NotEmpty().GreaterThan(x => x.StartDate)
            .WithMessage("End date must be after start date.");
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
