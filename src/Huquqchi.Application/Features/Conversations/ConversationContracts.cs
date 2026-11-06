using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record ConversationItem(Guid Id, string Title, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
public sealed record MessageItem(Guid Id, MessageRole Role, string Content, DateTimeOffset CreatedAt);
