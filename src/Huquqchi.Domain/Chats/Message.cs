namespace Huquqchi.Domain;

public sealed class Message : Entity
{
    private Message() { }
    public Message(Guid conversationId, MessageRole role, string content)
    {
        ConversationId = conversationId;
        Role = role;
        Content = content.Trim();
    }

    public Guid ConversationId { get; private set; }
    public MessageRole Role { get; private set; }
    public string Content { get; private set; } = "";
}
