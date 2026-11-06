namespace Huquqchi.Domain;

public sealed class Analysis : Entity
{
    private Analysis() { }
    public Analysis(Guid workspaceId, Guid documentVersionId, string purpose, string? userRole)
    {
        WorkspaceId = workspaceId;
        DocumentVersionId = documentVersionId;
        Purpose = purpose.Trim();
        UserRole = userRole?.Trim();
        Status = AnalysisStatus.Queued;
    }

    public Guid WorkspaceId { get; private set; }
    public Guid DocumentVersionId { get; private set; }
    public string Purpose { get; private set; } = "";
    public string? UserRole { get; private set; }
    public AnalysisStatus Status { get; private set; }
    public string? Summary { get; private set; }
    public string? Error { get; private set; }

    public void Complete(string summary) { Status = AnalysisStatus.Completed; Summary = summary; Touch(); }
    public void Fail(string error) { Status = AnalysisStatus.Failed; Error = error; Touch(); }
}
