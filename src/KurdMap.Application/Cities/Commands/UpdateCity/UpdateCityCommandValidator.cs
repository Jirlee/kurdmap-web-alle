using FluentValidation;

namespace KurdMap.Application.Cities.Commands.UpdateCity;

public sealed class UpdateCityCommandValidator : AbstractValidator<UpdateCityCommand>
{
    public UpdateCityCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Name.Ku).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Name.De).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
    }
}
