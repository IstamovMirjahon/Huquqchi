namespace Huquqchi.Domain;

public sealed class Conversation : Entity
{
    private Conversation() { }
    public Conversation(Guid workspaceId, Guid ownerId, string title)
    {
        WorkspaceId = workspaceId;
        OwnerId = ownerId;
        Title = title.Trim();
    }

    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public string Title { get; private set; } = "";
    public bool IsDeleted { get; private set; }

    public void Rename(string title) { Title = title.Trim(); Touch(); }
    public void Delete() { IsDeleted = true; Touch(); }
}
