using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IAppDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<Workspace> Workspaces { get; }
    IQueryable<Membership> Memberships { get; }
    IQueryable<Conversation> Conversations { get; }
    IQueryable<Message> Messages { get; }
    IQueryable<Citation> Citations { get; }
    IQueryable<UploadedDocument> UploadedDocuments { get; }
    IQueryable<DocumentVersion> DocumentVersions { get; }
    IQueryable<ConversationDocument> ConversationDocuments { get; }
    IQueryable<Analysis> Analyses { get; }
    IQueryable<Finding> Findings { get; }
    IQueryable<LegalDocument> LegalDocuments { get; }
    IQueryable<LegalVersion> LegalVersions { get; }
    IQueryable<LegalSection> LegalSections { get; }
    IQueryable<Template> Templates { get; }
    IQueryable<Draft> Drafts { get; }
    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ITokenService { string Create(Guid userId, Guid workspaceId, string role); }
public interface IFileStorage
{
    Task<(string Key, string Sha256)> SaveAsync(Stream stream, string extension, CancellationToken ct);
    Task<Stream> OpenReadAsync(string key, CancellationToken ct);
    Task DeleteAsync(string key, CancellationToken ct);
}

public sealed record Actor(Guid UserId, Guid WorkspaceId, string Role);
public sealed record AuthResult(string AccessToken, Guid UserId, Guid WorkspaceId, string Role);
public sealed record DocumentListItem(Guid Id, string Name, string ContentType, long Size, DocumentOrigin Origin, DocumentStatus Status, string? Tags, DateTimeOffset CreatedAt, DateTimeOffset? LastAnalyzedAt);
public sealed record AnalysisResult(Guid Id, AnalysisStatus Status, string Purpose, string? UserRole, string? Summary, string? Error, DateTimeOffset CreatedAt, IReadOnlyList<FindingItem> Findings);
public sealed record FindingItem(string Title, FindingSeverity Severity, string Explanation, string? Excerpt, string? Locator);
public sealed record ConversationItem(Guid Id, string Title, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
public sealed record MessageItem(Guid Id, MessageRole Role, string Content, DateTimeOffset CreatedAt);
public sealed record LegalSearchItem(Guid Id, string Title, string Type, string Number, string OfficialUrl);
public sealed record DraftItem(Guid Id, Guid TemplateId, string Name, string DataJson, string RenderedContent, DateTimeOffset CreatedAt);

public sealed class NotFoundException(string message) : Exception(message);
public sealed class ForbiddenException(string message) : Exception(message);
public sealed class ValidationException(string message) : Exception(message);
