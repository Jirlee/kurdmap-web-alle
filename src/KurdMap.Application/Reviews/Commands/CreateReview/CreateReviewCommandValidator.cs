using FluentValidation;

namespace KurdMap.Application.Reviews.Commands.CreateReview;

public sealed class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.BusinessId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");
        RuleFor(x => x.Comment).MaximumLength(2000).When(x => x.Comment is not null);
    }
}
