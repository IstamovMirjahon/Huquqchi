namespace Huquqchi.Domain;

public sealed class DocumentVersion : Entity
{
    private DocumentVersion() { }
    public DocumentVersion(Guid documentId, int version, string storageKey, string sha256, string? extractedText = null)
    {
        DocumentId = documentId;
        Version = version;
        StorageKey = storageKey;
        Sha256 = sha256;
        ExtractedText = extractedText;
    }

    public Guid DocumentId { get; private set; }
    public int Version { get; private set; }
    public string StorageKey { get; private set; } = "";
    public string Sha256 { get; private set; } = "";
    public string? ExtractedText { get; private set; }
}
