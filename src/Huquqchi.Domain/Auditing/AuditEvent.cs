namespace Huquqchi.Domain;

public sealed class AuditEvent : Entity
{
    private AuditEvent() { }
    public AuditEvent(Guid? userId, Guid? workspaceId, string action, string resourceType, string? resourceId)
    {
        UserId = userId;
        WorkspaceId = workspaceId;
        Action = action;
        ResourceType = resourceType;
        ResourceId = resourceId;
    }

    public Guid? UserId { get; private set; }
    public Guid? WorkspaceId { get; private set; }
    public string Action { get; private set; } = "";
    public string ResourceType { get; private set; } = "";
    public string? ResourceId { get; private set; }
}
