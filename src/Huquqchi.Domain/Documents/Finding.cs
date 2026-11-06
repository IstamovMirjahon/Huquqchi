namespace Huquqchi.Domain;

public sealed class Finding : Entity
{
    private Finding() { }
    public Finding(Guid analysisId, string title, FindingSeverity severity, string explanation, string? excerpt = null, string? locator = null)
    {
        AnalysisId = analysisId;
        Title = title;
        Severity = severity;
        Explanation = explanation;
        Excerpt = excerpt;
        Locator = locator;
    }

    public Guid AnalysisId { get; private set; }
    public string Title { get; private set; } = "";
    public FindingSeverity Severity { get; private set; }
    public string Explanation { get; private set; } = "";
    public string? Excerpt { get; private set; }
    public string? Locator { get; private set; }
}
