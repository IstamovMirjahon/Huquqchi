using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/conversations")]
public sealed class ConversationsController(ConversationService service) : ApiController
{
    [HttpGet] public IReadOnlyList<ConversationItem> List() => service.List(Actor);
    [HttpPost] public async Task<ActionResult<ConversationItem>> Create(CreateConversationRequest request, CancellationToken ct) { var result = await service.CreateAsync(Actor, request.Title, ct); return CreatedAtAction(nameof(Messages), new { id = result.Id }, result); }
    [HttpGet("{id:guid}/messages")] public IReadOnlyList<MessageItem> Messages(Guid id) => service.Messages(Actor, id);
    [HttpPost("{id:guid}/messages")] public Task<IReadOnlyList<MessageItem>> Send(Guid id, SendMessageRequest request, CancellationToken ct) => service.SendAsync(Actor, id, request.Content, ct);
    [HttpPost("{id:guid}/documents/{documentId:guid}")] public async Task<IActionResult> Attach(Guid id, Guid documentId, CancellationToken ct) { await service.AttachAsync(Actor, id, documentId, ct); return NoContent(); }
}
public sealed record CreateConversationRequest(string Title);
public sealed record SendMessageRequest(string Content);
