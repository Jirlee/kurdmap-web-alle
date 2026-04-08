using FluentValidation;

namespace KurdMap.Application.Businesses.Commands.CreateBusiness;

public sealed class CreateBusinessCommandValidator : AbstractValidator<CreateBusinessCommand>
{
    public CreateBusinessCommandValidator()
    {
        RuleFor(x => x.Name.Ku).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Name.De).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Name.Kmr).MaximumLength(200);
        RuleFor(x => x.Name.En).MaximumLength(200);

        RuleFor(x => x.Description.Ku).NotEmpty();
        RuleFor(x => x.Description.De).NotEmpty();

        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.CityId).NotEmpty();

        RuleFor(x => x.Street).NotEmpty().MaximumLength(300);
        RuleFor(x => x.PostalCode).NotEmpty().MaximumLength(10);

        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);

        RuleFor(x => x.Phone).MaximumLength(20);
        RuleFor(x => x.Email).MaximumLength(200).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
        RuleFor(x => x.Website).MaximumLength(500);
    }
}
