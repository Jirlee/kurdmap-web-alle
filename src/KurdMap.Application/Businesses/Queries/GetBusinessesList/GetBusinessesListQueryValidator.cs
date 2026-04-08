using FluentValidation;

namespace KurdMap.Application.Businesses.Queries.GetBusinessesList;

public sealed class GetBusinessesListQueryValidator : AbstractValidator<GetBusinessesListQuery>
{
    public GetBusinessesListQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}
