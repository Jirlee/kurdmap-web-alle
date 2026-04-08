using FluentValidation;

namespace KurdMap.Application.Businesses.Queries.SearchBusinesses;

public sealed class SearchBusinessesQueryValidator : AbstractValidator<SearchBusinessesQuery>
{
    public SearchBusinessesQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
        RuleFor(x => x.Search).MaximumLength(200).When(x => x.Search is not null);
        RuleFor(x => x.Sort).IsInEnum();
    }
}
