namespace Huquqchi.Domain;

public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; protected set; }
    protected void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}

public enum WorkspaceKind { Personal, Business }
public enum MemberRole { Owner, Member, LegalEditor, Support, Administrator }
public enum MessageRole { User, Assistant, System }
public enum DocumentStatus { Saved, Processing, Ready, Failed, Draft, Deleted }
public enum DocumentOrigin { Uploaded, Chat, Generated }
public enum AnalysisStatus { Queued, Processing, Completed, Failed }
public enum FindingSeverity { Information, NeedsReview, HighAttention }
public enum ContentStatus { Draft, Review, Published, Archived }

public sealed class User : Entity
{
    private User() { }
    public User(string phone, string name, string language = "uz-Latn")
    {
        Phone = phone.Trim();
        Name = name.Trim();
        Language = language;
    }
    public string Phone { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string Language { get; private set; } = "uz-Latn";
    public bool IsActive { get; private set; } = true;
    public void UpdateProfile(string name, string language) { Name = name.Trim(); Language = language; Touch(); }
}

public sealed class Workspace : Entity
{
    private Workspace() { }
    public Workspace(string name, WorkspaceKind kind) { Name = name.Trim(); Kind = kind; }
    public string Name { get; private set; } = "";
    public WorkspaceKind Kind { get; private set; }
}

public sealed class Membership : Entity
{
    private Membership() { }
    public Membership(Guid userId, Guid workspaceId, MemberRole role) { UserId = userId; WorkspaceId = workspaceId; Role = role; }
    public Guid UserId { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public MemberRole Role { get; private set; }
}

public sealed class Conversation : Entity
{
    private Conversation() { }
    public Conversation(Guid workspaceId, Guid ownerId, string title) { WorkspaceId = workspaceId; OwnerId = ownerId; Title = title.Trim(); }
    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public string Title { get; private set; } = "";
    public bool IsDeleted { get; private set; }
    public void Rename(string title) { Title = title.Trim(); Touch(); }
    public void Delete() { IsDeleted = true; Touch(); }
}

public sealed class Message : Entity
{
    private Message() { }
    public Message(Guid conversationId, MessageRole role, string content) { ConversationId = conversationId; Role = role; Content = content.Trim(); }
    public Guid ConversationId { get; private set; }
    public MessageRole Role { get; private set; }
    public string Content { get; private set; } = "";
}

public sealed class Citation : Entity
{
    private Citation() { }
    public Citation(Guid messageId, Guid legalVersionId, string locator, string excerpt)
    { MessageId = messageId; LegalVersionId = legalVersionId; Locator = locator; Excerpt = excerpt; }
    public Guid MessageId { get; private set; }
    public Guid LegalVersionId { get; private set; }
    public string Locator { get; private set; } = "";
    public string Excerpt { get; private set; } = "";
}

public sealed class UploadedDocument : Entity
{
    private UploadedDocument() { }
    public UploadedDocument(Guid workspaceId, Guid ownerId, string name, string contentType, long size, DocumentOrigin origin)
    { WorkspaceId = workspaceId; OwnerId = ownerId; Name = name.Trim(); ContentType = contentType; Size = size; Origin = origin; Status = origin == DocumentOrigin.Generated ? DocumentStatus.Draft : DocumentStatus.Saved; }
    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public long Size { get; private set; }
    public DocumentOrigin Origin { get; private set; }
    public DocumentStatus Status { get; private set; }
    public string? Tags { get; private set; }
    public DateTimeOffset? LastAnalyzedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public void Rename(string name) { Name = name.Trim(); Touch(); }
    public void SetTags(string? tags) { Tags = tags?.Trim(); Touch(); }
    public void MarkProcessing() { Status = DocumentStatus.Processing; Touch(); }
    public void MarkReady() { Status = DocumentStatus.Ready; LastAnalyzedAt = DateTimeOffset.UtcNow; Touch(); }
    public void Delete() { IsDeleted = true; Status = DocumentStatus.Deleted; Touch(); }
}

public sealed class DocumentVersion : Entity
{
    private DocumentVersion() { }
    public DocumentVersion(Guid documentId, int version, string storageKey, string sha256, string? extractedText = null)
    { DocumentId = documentId; Version = version; StorageKey = storageKey; Sha256 = sha256; ExtractedText = extractedText; }
    public Guid DocumentId { get; private set; }
    public int Version { get; private set; }
    public string StorageKey { get; private set; } = "";
    public string Sha256 { get; private set; } = "";
    public string? ExtractedText { get; private set; }
}

public sealed class ConversationDocument : Entity
{
    private ConversationDocument() { }
    public ConversationDocument(Guid conversationId, Guid documentId) { ConversationId = conversationId; DocumentId = documentId; }
    public Guid ConversationId { get; private set; }
    public Guid DocumentId { get; private set; }
}

public sealed class Analysis : Entity
{
    private Analysis() { }
    public Analysis(Guid workspaceId, Guid documentVersionId, string purpose, string? userRole)
    { WorkspaceId = workspaceId; DocumentVersionId = documentVersionId; Purpose = purpose.Trim(); UserRole = userRole?.Trim(); Status = AnalysisStatus.Queued; }
    public Guid WorkspaceId { get; private set; }
    public Guid DocumentVersionId { get; private set; }
    public string Purpose { get; private set; } = "";
    public string? UserRole { get; private set; }
    public AnalysisStatus Status { get; private set; }
    public string? Summary { get; private set; }
    public string? Error { get; private set; }
    public void Complete(string summary) { Status = AnalysisStatus.Completed; Summary = summary; Touch(); }
    public void Fail(string error) { Status = AnalysisStatus.Failed; Error = error; Touch(); }
}

public sealed class Finding : Entity
{
    private Finding() { }
    public Finding(Guid analysisId, string title, FindingSeverity severity, string explanation, string? excerpt = null, string? locator = null)
    { AnalysisId = analysisId; Title = title; Severity = severity; Explanation = explanation; Excerpt = excerpt; Locator = locator; }
    public Guid AnalysisId { get; private set; }
    public string Title { get; private set; } = "";
    public FindingSeverity Severity { get; private set; }
    public string Explanation { get; private set; } = "";
    public string? Excerpt { get; private set; }
    public string? Locator { get; private set; }
}

public sealed class LegalDocument : Entity
{
    private LegalDocument() { }
    public LegalDocument(string title, string type, string number, string officialUrl)
    { Title = title; Type = type; Number = number; OfficialUrl = officialUrl; }
    public string Title { get; private set; } = "";
    public string Type { get; private set; } = "";
    public string Number { get; private set; } = "";
    public string OfficialUrl { get; private set; } = "";
    public ContentStatus Status { get; private set; } = ContentStatus.Draft;
    public void Publish() { Status = ContentStatus.Published; Touch(); }
}

public sealed class LegalVersion : Entity
{
    private LegalVersion() { }
    public LegalVersion(Guid legalDocumentId, DateOnly effectiveFrom, string sourceUrl, bool isCurrent)
    { LegalDocumentId = legalDocumentId; EffectiveFrom = effectiveFrom; SourceUrl = sourceUrl; IsCurrent = isCurrent; }
    public Guid LegalDocumentId { get; private set; }
    public DateOnly EffectiveFrom { get; private set; }
    public DateOnly? EffectiveTo { get; private set; }
    public string SourceUrl { get; private set; } = "";
    public bool IsCurrent { get; private set; }
}

public sealed class LegalSection : Entity
{
    private LegalSection() { }
    public LegalSection(Guid legalVersionId, string number, string title, string text)
    { LegalVersionId = legalVersionId; Number = number; Title = title; Text = text; }
    public Guid LegalVersionId { get; private set; }
    public string Number { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Text { get; private set; } = "";
}

public sealed class Template : Entity
{
    private Template() { }
    public Template(string code, string name, string category, string schemaJson, string body)
    { Code = code; Name = name; Category = category; SchemaJson = schemaJson; Body = body; }
    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string Category { get; private set; } = "";
    public string SchemaJson { get; private set; } = "{}";
    public string Body { get; private set; } = "";
    public ContentStatus Status { get; private set; } = ContentStatus.Published;
}

public sealed class Draft : Entity
{
    private Draft() { }
    public Draft(Guid workspaceId, Guid ownerId, Guid templateId, string name, string dataJson, string renderedContent)
    { WorkspaceId = workspaceId; OwnerId = ownerId; TemplateId = templateId; Name = name; DataJson = dataJson; RenderedContent = renderedContent; }
    public Guid WorkspaceId { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid TemplateId { get; private set; }
    public string Name { get; private set; } = "";
    public string DataJson { get; private set; } = "{}";
    public string RenderedContent { get; private set; } = "";
}

public sealed class Consent : Entity
{
    private Consent() { }
    public Consent(Guid userId, string policy, string version) { UserId = userId; Policy = policy; Version = version; AcceptedAt = DateTimeOffset.UtcNow; }
    public Guid UserId { get; private set; }
    public string Policy { get; private set; } = "";
    public string Version { get; private set; } = "";
    public DateTimeOffset AcceptedAt { get; private set; }
}

public sealed class AuditEvent : Entity
{
    private AuditEvent() { }
    public AuditEvent(Guid? userId, Guid? workspaceId, string action, string resourceType, string? resourceId)
    { UserId = userId; WorkspaceId = workspaceId; Action = action; ResourceType = resourceType; ResourceId = resourceId; }
    public Guid? UserId { get; private set; }
    public Guid? WorkspaceId { get; private set; }
    public string Action { get; private set; } = "";
    public string ResourceType { get; private set; } = "";
    public string? ResourceId { get; private set; }
}
