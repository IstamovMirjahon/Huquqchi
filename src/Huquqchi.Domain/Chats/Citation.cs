namespace Huquqchi.Domain;

public sealed class Citation : Entity
{
    private Citation() { }
    public Citation(Guid messageId, Guid legalVersionId, string locator, string excerpt)
    {
        MessageId = messageId;
        LegalVersionId = legalVersionId;
        Locator = locator;
        Excerpt = excerpt;
    }

    public Guid MessageId { get; private set; }
    public Guid LegalVersionId { get; private set; }
    public string Locator { get; private set; } = "";
    public string Excerpt { get; private set; } = "";
}
