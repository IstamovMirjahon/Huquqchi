namespace Huquqchi.Application;

public sealed record LegalSearchItem(Guid Id, string Title, string Type, string Number, string OfficialUrl);
public sealed record LegalSectionItem(Guid Id, string Number, string Title, string Text);
public sealed record LegalVersionItem(Guid Id, DateOnly EffectiveFrom, DateOnly? EffectiveTo, bool IsCurrent, string SourceUrl, IReadOnlyList<LegalSectionItem> Sections);
public sealed record LegalDocumentDetails(Guid Id, string Title, string Type, string Number, string OfficialUrl, IReadOnlyList<LegalVersionItem> Versions);
