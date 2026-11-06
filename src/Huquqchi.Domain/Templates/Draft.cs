namespace Huquqchi.Domain;

public sealed class Draft : Entity
{
    private Draft() { }
    public Draft(Guid workspaceId, Guid ownerId, Guid templateId, string name, string dataJson, string renderedContent)
    {
        WorkspaceId = workspaceId;
        OwnerId = ownerId;
        TemplateId = templateId;
        Name = name;
        DataJson = dataJson;
        RenderedContent = renderedContent;
    }

    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid TemplateId { get; private set; }
    public string Name { get; private set; } = "";
    public string DataJson { get; private set; } = "{}";
    public string RenderedContent { get; private set; } = "";
}
