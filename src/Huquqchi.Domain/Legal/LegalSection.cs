namespace Huquqchi.Domain;

public sealed class LegalSection : Entity
{
    private LegalSection() { }
    public LegalSection(Guid legalVersionId, string number, string title, string text)
    {
        LegalVersionId = legalVersionId;
        Number = number;
        Title = title;
        Text = text;
    }

    public Guid LegalVersionId { get; private set; }
    public string Number { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Text { get; private set; } = "";
}
