using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record UploadDocumentCommand(Stream Content, string FileName, string ContentType, long Length, DocumentOrigin Origin);
public sealed record UpdateDocumentCommand(string Name, string? Tags);
public sealed record StartAnalysisCommand(string Purpose, string? UserRole);
public sealed record DocumentListItem(Guid Id, string Name, string ContentType, long Size, DocumentOrigin Origin, DocumentStatus Status, string? Tags, DateTimeOffset CreatedAt, DateTimeOffset? LastAnalyzedAt);
public sealed record FindingItem(string Title, FindingSeverity Severity, string Explanation, string? Excerpt, string? Locator);
public sealed record AnalysisResult(Guid Id, AnalysisStatus Status, string Purpose, string? UserRole, string? Summary, string? Error, DateTimeOffset CreatedAt, IReadOnlyList<FindingItem> Findings);
public sealed record DocumentDownload(Stream Content, string Name, string ContentType);
