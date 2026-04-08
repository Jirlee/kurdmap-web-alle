using KurdMap.Application.Common.Models;
using KurdMap.Application.ContactMessages.DTOs;
using KurdMap.Domain.Common;
using KurdMap.Domain.ContactMessages;
using KurdMap.Domain.ContactMessages.Entities;
using MediatR;

namespace KurdMap.Application.ContactMessages.Commands.SubmitContactMessage;

public sealed record SubmitContactMessageCommand(
    string Name,
    string Email,
    string Message) : IRequest<Result<ContactMessageDto>>;

public sealed class SubmitContactMessageCommandHandler(
    IContactMessageRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<SubmitContactMessageCommand, Result<ContactMessageDto>>
{
    public async Task<Result<ContactMessageDto>> Handle(SubmitContactMessageCommand request, CancellationToken ct)
    {
        var message = ContactMessage.Create(request.Name, request.Email, request.Message);
        await repository.AddAsync(message, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new ContactMessageDto(
            message.Id, message.Name, message.Email,
            message.Message, message.IsRead, message.CreatedAt);
    }
}
