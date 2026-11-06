namespace Huquqchi.Application;

public interface IConversationService
{
    Task<Result<IReadOnlyList<ConversationItem>>> ListAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result<ConversationItem>> CreateAsync(Actor actor, string title, CancellationToken cancellationToken);
    Task<Result<IReadOnlyList<MessageItem>>> GetMessagesAsync(Actor actor, Guid id, CancellationToken cancellationToken);
    Task<Result<IReadOnlyList<MessageItem>>> SendAsync(Actor actor, Guid id, string content, CancellationToken cancellationToken);
    Task<Result> AttachDocumentAsync(Actor actor, Guid id, Guid documentId, CancellationToken cancellationToken);
}
