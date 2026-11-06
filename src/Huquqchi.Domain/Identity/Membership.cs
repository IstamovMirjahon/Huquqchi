namespace Huquqchi.Domain;

public sealed class Membership : Entity
{
    private Membership() { }
    public Membership(Guid userId, Guid workspaceId, MemberRole role)
    {
        UserId = userId;
        WorkspaceId = workspaceId;
        Role = role;
    }

    public Guid UserId { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public MemberRole Role { get; private set; }
}
