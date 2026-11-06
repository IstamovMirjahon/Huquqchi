namespace Huquqchi.Domain;

public sealed class UploadedDocument : Entity
{
    private UploadedDocument() { }
    public UploadedDocument(Guid workspaceId, Guid ownerId, string name, string contentType, long size, DocumentOrigin origin)
    {
        WorkspaceId = workspaceId;
        OwnerId = ownerId;
        Name = name.Trim();
        ContentType = contentType;
        Size = size;
        Origin = origin;
        Status = origin == DocumentOrigin.Generated ? DocumentStatus.Draft : DocumentStatus.Saved;
    }

    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public long Size { get; private set; }
    public DocumentOrigin Origin { get; private set; }
    public DocumentStatus Status { get; private set; }
    public string? Tags { get; private set; }
    public DateTimeOffset? LastAnalyzedAt { get; private set; }
    public bool IsDeleted { get; private set; }

    public void Rename(string name) { Name = name.Trim(); Touch(); }
    public void SetTags(string? tags) { Tags = tags?.Trim(); Touch(); }
    public void MarkProcessing() { Status = DocumentStatus.Processing; Touch(); }
    public void MarkReady() { Status = DocumentStatus.Ready; LastAnalyzedAt = DateTimeOffset.UtcNow; Touch(); }
    public void Delete() { IsDeleted = true; Status = DocumentStatus.Deleted; Touch(); }
}
