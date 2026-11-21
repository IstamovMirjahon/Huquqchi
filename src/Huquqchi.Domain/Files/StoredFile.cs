namespace Huquqchi.Domain;

/// <summary>
/// General-purpose upload (order chat, KYC, job attachments, deliveries, avatars).
/// The document vault (<see cref="UploadedDocument"/>) is a separate aggregate.
/// </summary>
public sealed class StoredFile : Entity
{
    private StoredFile() { }

    public StoredFile(Guid ownerId, Guid workspaceId, FilePurpose purpose, string name, string mime, long size,
        string storageKey, string sha256, FileScanStatus scanStatus)
    {
        OwnerId = ownerId;
        WorkspaceId = workspaceId;
        Purpose = purpose;
        Name = name.Trim();
        Mime = mime;
        Size = size;
        StorageKey = storageKey;
        Sha256 = sha256;
        ScanStatus = scanStatus;
    }

    public Guid OwnerId { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public FilePurpose Purpose { get; private set; }
    public string Name { get; private set; } = "";
    public string Mime { get; private set; } = "";
    public long Size { get; private set; }
    public string StorageKey { get; private set; } = "";
    public string Sha256 { get; private set; } = "";
    public FileScanStatus ScanStatus { get; private set; }
    public bool IsDeleted { get; private set; }

    public void Delete() { IsDeleted = true; Touch(); }
}
