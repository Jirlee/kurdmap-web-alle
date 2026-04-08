using KurdMap.Application.Common.Models;
using KurdMap.Application.ContactMessages.DTOs;
using KurdMap.Domain.ContactMessages;
using MediatR;

namespace KurdMap.Application.ContactMessages.Queries.GetContactMessages;

public sealed record GetContactMessagesQuery : IRequest<Result<List<ContactMessageDto>>>;

public sealed class GetContactMessagesQueryHandler(
    IContactMessageRepository repository) : IRequestHandler<GetContactMessagesQuery, Result<List<ContactMessageDto>>>
{
    public async Task<Result<List<ContactMessageDto>>> Handle(GetContactMessagesQuery request, CancellationToken ct)
    {
        var messages = await repository.GetAllAsync(ct);
        var dtos = messages.Select(m => new ContactMessageDto(
            m.Id, m.Name, m.Email, m.Message, m.IsRead, m.CreatedAt)).ToList();
        return Result<List<ContactMessageDto>>.Success(dtos);
    }
}
