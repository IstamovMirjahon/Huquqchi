namespace Huquqchi.Domain;

public sealed class LegalDocument : Entity
{
    private LegalDocument() { }
    public LegalDocument(string title, string type, string number, string officialUrl)
    {
        Title = title;
        Type = type;
        Number = number;
        OfficialUrl = officialUrl;
    }

    public string Title { get; private set; } = "";
    public string Type { get; private set; } = "";
    public string Number { get; private set; } = "";
    public string OfficialUrl { get; private set; } = "";
    public ContentStatus Status { get; private set; } = ContentStatus.Draft;

    public void Publish() { Status = ContentStatus.Published; Touch(); }
}
