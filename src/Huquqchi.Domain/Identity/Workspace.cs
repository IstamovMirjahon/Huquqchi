namespace Huquqchi.Domain;

public sealed class Workspace : Entity
{
    private Workspace() { }
    public Workspace(string name, WorkspaceKind kind)
    {
        Name = name.Trim();
        Kind = kind;
    }

    public string Name { get; private set; } = "";
    public WorkspaceKind Kind { get; private set; }
}
