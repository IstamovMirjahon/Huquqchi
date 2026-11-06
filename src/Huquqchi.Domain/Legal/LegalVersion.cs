namespace Huquqchi.Domain;

public sealed class LegalVersion : Entity
{
    private LegalVersion() { }
    public LegalVersion(Guid legalDocumentId, DateOnly effectiveFrom, string sourceUrl, bool isCurrent)
    {
        LegalDocumentId = legalDocumentId;
        EffectiveFrom = effectiveFrom;
        SourceUrl = sourceUrl;
        IsCurrent = isCurrent;
    }

    public Guid LegalDocumentId { get; private set; }
    public DateOnly EffectiveFrom { get; private set; }
    public DateOnly? EffectiveTo { get; private set; }
    public string SourceUrl { get; private set; } = "";
    public bool IsCurrent { get; private set; }
}
