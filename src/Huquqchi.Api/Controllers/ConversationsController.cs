using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/conversations")]
public sealed class ConversationsController(IConversationService service) : ApiController
{
    [HttpGet] public async Task<ActionResult<IReadOnlyList<ConversationItem>>> List(CancellationToken ct) => (await service.ListAsync(Actor, ct)).ToActionResult(this);
    [HttpPost]
    public async Task<ActionResult<ConversationItem>> Create(CreateConversationRequest request, CancellationToken ct)
    { var result = await service.CreateAsync(Actor, request.Title, ct); return result.IsFailure ? this.ToProblem(result.Error) : CreatedAtAction(nameof(Messages), new { id = result.Value.Id }, result.Value); }
    [HttpGet("{id:guid}/messages")] public async Task<ActionResult<IReadOnlyList<MessageItem>>> Messages(Guid id, CancellationToken ct) => (await service.GetMessagesAsync(Actor, id, ct)).ToActionResult(this);
    [HttpPost("{id:guid}/messages")] public async Task<ActionResult<IReadOnlyList<MessageItem>>> Send(Guid id, SendMessageRequest request, CancellationToken ct) => (await service.SendAsync(Actor, id, request.Content, ct)).ToActionResult(this);
    [HttpPost("{id:guid}/documents/{documentId:guid}")] public async Task<IActionResult> Attach(Guid id, Guid documentId, CancellationToken ct) => (await service.AttachDocumentAsync(Actor, id, documentId, ct)).ToNoContentResult(this);
}
public sealed record CreateConversationRequest(string Title);
public sealed record SendMessageRequest(string Content);
