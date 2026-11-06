using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class ConversationService(IUnitOfWork unitOfWork) : IConversationService
{
    public async Task<Result<IReadOnlyList<ConversationItem>>> ListAsync(Actor actor, CancellationToken cancellationToken)
    {
        var conversations = await unitOfWork.Repository<Conversation>().ListAsync(
            x => x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted,
            q => q.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<ConversationItem>>(conversations.Select(Map).ToList());
    }

    public async Task<Result<ConversationItem>> CreateAsync(Actor actor, string title, CancellationToken cancellationToken)
    {
        var conversation = new Conversation(actor.WorkspaceId, actor.UserId,
            string.IsNullOrWhiteSpace(title) ? "Yangi suhbat" : title);
        await unitOfWork.Repository<Conversation>().AddAsync(conversation, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Map(conversation));
    }

    public async Task<Result<IReadOnlyList<MessageItem>>> GetMessagesAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, id, cancellationToken);
        if (owned.IsFailure) return Result.Failure<IReadOnlyList<MessageItem>>(owned.Error);
        var messages = await unitOfWork.Repository<Message>().ListAsync(x => x.ConversationId == id,
            q => q.OrderBy(x => x.CreatedAt), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<MessageItem>>(messages.Select(Map).ToList());
    }

    public async Task<Result<IReadOnlyList<MessageItem>>> SendAsync(Actor actor, Guid id, string content, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(content)) return Result.Failure<IReadOnlyList<MessageItem>>(ApplicationErrors.Conversations.EmptyMessage);
        var owned = await GetOwnedAsync(actor, id, cancellationToken, true);
        if (owned.IsFailure) return Result.Failure<IReadOnlyList<MessageItem>>(owned.Error);

        var userMessage = new Message(id, MessageRole.User, content);
        var assistantMessage = new Message(id, MessageRole.Assistant,
            "AI provayderi hali ulanmagan. Savolingiz saqlandi; tasdiqlangan manbasiz huquqiy javob yaratilmaydi. Muhim qaror oldidan mutaxassis bilan tekshiring.");
        await unitOfWork.Repository<Message>().AddAsync(userMessage, cancellationToken);
        await unitOfWork.Repository<Message>().AddAsync(assistantMessage, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success<IReadOnlyList<MessageItem>>([Map(userMessage), Map(assistantMessage)]);
    }

    public async Task<Result> AttachDocumentAsync(Actor actor, Guid id, Guid documentId, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, id, cancellationToken);
        if (owned.IsFailure) return Result.Failure(owned.Error);
        var documentExists = await unitOfWork.Repository<UploadedDocument>().AnyAsync(
            x => x.Id == documentId && x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted, cancellationToken);
        if (!documentExists) return Result.Failure(ApplicationErrors.Documents.NotFound);
        var links = unitOfWork.Repository<ConversationDocument>();
        if (!await links.AnyAsync(x => x.ConversationId == id && x.DocumentId == documentId, cancellationToken))
            await links.AddAsync(new ConversationDocument(id, documentId), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<Result<Conversation>> GetOwnedAsync(Actor actor, Guid id, CancellationToken cancellationToken, bool tracking = false)
    {
        var conversation = await unitOfWork.Repository<Conversation>().FirstOrDefaultAsync(
            x => x.Id == id && x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted, tracking, cancellationToken);
        return conversation is null ? Result.Failure<Conversation>(ApplicationErrors.Conversations.NotFound) : Result.Success(conversation);
    }

    private static ConversationItem Map(Conversation value) => new(value.Id, value.Title, value.CreatedAt, value.UpdatedAt);
    private static MessageItem Map(Message value) => new(value.Id, value.Role, value.Content, value.CreatedAt);
}
