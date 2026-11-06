namespace Huquqchi.Application;

public sealed record TemplateItem(Guid Id, string Code, string Name, string Category, string SchemaJson);
public sealed record DraftItem(Guid Id, Guid TemplateId, string Name, string DataJson, string RenderedContent, DateTimeOffset CreatedAt);
public sealed record CreateDraftCommand(Guid TemplateId, string Name, Dictionary<string, string?> Fields);
