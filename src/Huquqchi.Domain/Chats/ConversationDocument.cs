namespace Huquqchi.Domain;

public sealed class ConversationDocument : Entity
{
    private ConversationDocument() { }
    public ConversationDocument(Guid conversationId, Guid documentId)
    {
        ConversationId = conversationId;
        DocumentId = documentId;
    }

    public Guid ConversationId { get; private set; }
    public Guid DocumentId { get; private set; }
}
