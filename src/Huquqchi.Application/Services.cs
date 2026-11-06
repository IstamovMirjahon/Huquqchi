using System.Text.Json;
using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class AuthService(IAppDbContext db, ITokenService tokens)
{
    public async Task<AuthResult> VerifyAsync(string phone, string code, string name, WorkspaceKind kind, string expectedCode, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(phone) || code != expectedCode) throw new ValidationException("Telefon yoki bir martalik kod noto‘g‘ri.");
        var user = db.Users.FirstOrDefault(x => x.Phone == phone.Trim());
        Workspace workspace;
        Membership membership;
        if (user is null)
        {
            user = new User(phone, string.IsNullOrWhiteSpace(name) ? "Foydalanuvchi" : name);
            workspace = new Workspace($"{user.Name} ish maydoni", kind);
            membership = new Membership(user.Id, workspace.Id, MemberRole.Owner);
            db.Add(user); db.Add(workspace); db.Add(membership);
            db.Add(new Consent(user.Id, "terms-and-privacy", "1.0"));
            await db.SaveChangesAsync(ct);
        }
        else
        {
            membership = db.Memberships.First(x => x.UserId == user.Id);
            workspace = db.Workspaces.First(x => x.Id == membership.WorkspaceId);
        }
        return new AuthResult(tokens.Create(user.Id, workspace.Id, membership.Role.ToString()), user.Id, workspace.Id, membership.Role.ToString());
    }
}

public sealed class DocumentService(IAppDbContext db, IFileStorage storage)
{
    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".docx", ".jpg", ".jpeg", ".png" };
    public IReadOnlyList<DocumentListItem> List(Actor actor, string? search, DocumentOrigin? origin) => db.UploadedDocuments
        .Where(x => x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted && (origin == null || x.Origin == origin) &&
                    (string.IsNullOrWhiteSpace(search) || x.Name.ToLower().Contains(search.ToLower()) || (x.Tags != null && x.Tags.ToLower().Contains(search.ToLower()))))
        .OrderByDescending(x => x.CreatedAt).Select(Map).ToList();

    public async Task<DocumentListItem> UploadAsync(Actor actor, Stream stream, string fileName, string contentType, long length, DocumentOrigin origin, CancellationToken ct)
    {
        var ext = Path.GetExtension(fileName);
        if (!Allowed.Contains(ext)) throw new ValidationException("Faqat PDF, DOCX, JPG va PNG fayllar qabul qilinadi.");
        if (length <= 0 || length > 25 * 1024 * 1024) throw new ValidationException("Fayl hajmi 25 MB dan oshmasligi kerak.");
        var saved = await storage.SaveAsync(stream, ext, ct);
        var duplicate = db.DocumentVersions.FirstOrDefault(x => x.Sha256 == saved.Sha256 && db.UploadedDocuments.Any(d => d.Id == x.DocumentId && d.WorkspaceId == actor.WorkspaceId && !d.IsDeleted));
        if (duplicate is not null) { await storage.DeleteAsync(saved.Key, ct); throw new ValidationException($"Bu fayl avval yuklangan. Mavjud documentId: {duplicate.DocumentId}"); }
        var document = new UploadedDocument(actor.WorkspaceId, actor.UserId, fileName, contentType, length, origin);
        db.Add(document); db.Add(new DocumentVersion(document.Id, 1, saved.Key, saved.Sha256));
        db.Add(new AuditEvent(actor.UserId, actor.WorkspaceId, "document.uploaded", nameof(UploadedDocument), document.Id.ToString()));
        await db.SaveChangesAsync(ct);
        return Map(document);
    }

    public DocumentListItem Get(Actor actor, Guid id) => Map(Owned(actor, id));
    public async Task RenameAsync(Actor actor, Guid id, string name, string? tags, CancellationToken ct)
    { if (string.IsNullOrWhiteSpace(name)) throw new ValidationException("Nom bo‘sh bo‘lmasligi kerak."); var d = Owned(actor, id); d.Rename(name); d.SetTags(tags); await db.SaveChangesAsync(ct); }
    public async Task DeleteAsync(Actor actor, Guid id, CancellationToken ct)
    { var d = Owned(actor, id); d.Delete(); db.Add(new AuditEvent(actor.UserId, actor.WorkspaceId, "document.deleted", nameof(UploadedDocument), id.ToString())); await db.SaveChangesAsync(ct); }
    public async Task<(Stream Stream, string Name, string ContentType)> DownloadAsync(Actor actor, Guid id, CancellationToken ct)
    { var d = Owned(actor, id); var v = db.DocumentVersions.Where(x => x.DocumentId == id).OrderByDescending(x => x.Version).First(); return (await storage.OpenReadAsync(v.StorageKey, ct), d.Name, d.ContentType); }
    public async Task<AnalysisResult> StartAnalysisAsync(Actor actor, Guid id, string purpose, string? userRole, CancellationToken ct)
    {
        var d = Owned(actor, id); var v = db.DocumentVersions.Where(x => x.DocumentId == id).OrderByDescending(x => x.Version).First();
        if (string.IsNullOrWhiteSpace(purpose)) throw new ValidationException("Tahlil maqsadini kiriting.");
        d.MarkProcessing(); var a = new Analysis(actor.WorkspaceId, v.Id, purpose, userRole); db.Add(a);
        a.Complete("Hujjat saqlandi va tahlil so‘rovi qabul qilindi. AI/OCR provayderi ulanmaguncha avtomatik huquqiy xulosa berilmaydi.");
        db.Add(new Finding(a.Id, "Provayder integratsiyasi kutilmoqda", FindingSeverity.Information, "Hackathon adapteri hujjatni xavfsiz saqladi; huquqiy xulosa to‘qilmagan."));
        d.MarkReady(); await db.SaveChangesAsync(ct); return GetAnalysis(actor, a.Id);
    }
    public IReadOnlyList<AnalysisResult> Analyses(Actor actor, Guid documentId)
    { Owned(actor, documentId); var versionIds = db.DocumentVersions.Where(x => x.DocumentId == documentId).Select(x => x.Id); return db.Analyses.Where(x => versionIds.Contains(x.DocumentVersionId)).OrderByDescending(x => x.CreatedAt).ToList().Select(x => GetAnalysis(actor, x.Id)).ToList(); }
    public AnalysisResult GetAnalysis(Actor actor, Guid id)
    {
        var a = db.Analyses.FirstOrDefault(x => x.Id == id && x.WorkspaceId == actor.WorkspaceId) ?? throw new NotFoundException("Tahlil topilmadi.");
        var findings = db.Findings.Where(x => x.AnalysisId == id).Select(x => new FindingItem(x.Title, x.Severity, x.Explanation, x.Excerpt, x.Locator)).ToList();
        return new AnalysisResult(a.Id, a.Status, a.Purpose, a.UserRole, a.Summary, a.Error, a.CreatedAt, findings);
    }
    private UploadedDocument Owned(Actor actor, Guid id) => db.UploadedDocuments.FirstOrDefault(x => x.Id == id && x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted) ?? throw new NotFoundException("Hujjat topilmadi.");
    private static DocumentListItem Map(UploadedDocument x) => new(x.Id, x.Name, x.ContentType, x.Size, x.Origin, x.Status, x.Tags, x.CreatedAt, x.LastAnalyzedAt);
}

public sealed class ConversationService(IAppDbContext db)
{
    public IReadOnlyList<ConversationItem> List(Actor a) => db.Conversations.Where(x => x.WorkspaceId == a.WorkspaceId && !x.IsDeleted).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).Select(Map).ToList();
    public async Task<ConversationItem> CreateAsync(Actor a, string title, CancellationToken ct)
    { var c = new Conversation(a.WorkspaceId, a.UserId, string.IsNullOrWhiteSpace(title) ? "Yangi suhbat" : title); db.Add(c); await db.SaveChangesAsync(ct); return Map(c); }
    public IReadOnlyList<MessageItem> Messages(Actor a, Guid id) { Owned(a, id); return db.Messages.Where(x => x.ConversationId == id).OrderBy(x => x.CreatedAt).Select(x => new MessageItem(x.Id, x.Role, x.Content, x.CreatedAt)).ToList(); }
    public async Task<IReadOnlyList<MessageItem>> SendAsync(Actor a, Guid id, string content, CancellationToken ct)
    {
        Owned(a, id); if (string.IsNullOrWhiteSpace(content)) throw new ValidationException("Xabar bo‘sh bo‘lmasligi kerak.");
        var user = new Message(id, MessageRole.User, content); var assistant = new Message(id, MessageRole.Assistant, "AI provayderi hali ulanmagan. Savolingiz saqlandi; tasdiqlangan manbasiz huquqiy javob yaratilmaydi. Muhim qaror oldidan mutaxassis bilan tekshiring.");
        db.Add(user); db.Add(assistant); await db.SaveChangesAsync(ct);
        return new[] { new MessageItem(user.Id, user.Role, user.Content, user.CreatedAt), new MessageItem(assistant.Id, assistant.Role, assistant.Content, assistant.CreatedAt) };
    }
    public async Task AttachAsync(Actor a, Guid id, Guid documentId, CancellationToken ct)
    {
        Owned(a, id); if (!db.UploadedDocuments.Any(x => x.Id == documentId && x.WorkspaceId == a.WorkspaceId && !x.IsDeleted)) throw new NotFoundException("Hujjat topilmadi.");
        if (!db.ConversationDocuments.Any(x => x.ConversationId == id && x.DocumentId == documentId)) db.Add(new ConversationDocument(id, documentId));
        await db.SaveChangesAsync(ct);
    }
    private Conversation Owned(Actor a, Guid id) => db.Conversations.FirstOrDefault(x => x.Id == id && x.WorkspaceId == a.WorkspaceId && !x.IsDeleted) ?? throw new NotFoundException("Suhbat topilmadi.");
    private static ConversationItem Map(Conversation x) => new(x.Id, x.Title, x.CreatedAt, x.UpdatedAt);
}

public sealed class CatalogService(IAppDbContext db)
{
    public IReadOnlyList<LegalSearchItem> Search(string? query) => db.LegalDocuments.Where(x => x.Status == ContentStatus.Published && (string.IsNullOrWhiteSpace(query) || x.Title.ToLower().Contains(query.ToLower()) || x.Number.ToLower().Contains(query.ToLower())))
        .OrderBy(x => x.Title).Select(x => new LegalSearchItem(x.Id, x.Title, x.Type, x.Number, x.OfficialUrl)).ToList();
    public object Details(Guid id)
    {
        var d = db.LegalDocuments.FirstOrDefault(x => x.Id == id && x.Status == ContentStatus.Published) ?? throw new NotFoundException("Huquqiy hujjat topilmadi.");
        var versions = db.LegalVersions.Where(x => x.LegalDocumentId == id).OrderByDescending(x => x.EffectiveFrom).ToList().Select(v => new { v.Id, v.EffectiveFrom, v.EffectiveTo, v.IsCurrent, v.SourceUrl, Sections = db.LegalSections.Where(s => s.LegalVersionId == v.Id).OrderBy(s => s.Number).ToList() });
        return new { d.Id, d.Title, d.Type, d.Number, d.OfficialUrl, Versions = versions };
    }
}

public sealed class DraftService(IAppDbContext db)
{
    public IReadOnlyList<Template> Templates() => db.Templates.Where(x => x.Status == ContentStatus.Published).OrderBy(x => x.Name).ToList();
    public IReadOnlyList<DraftItem> List(Actor a) => db.Drafts.Where(x => x.WorkspaceId == a.WorkspaceId).OrderByDescending(x => x.CreatedAt).Select(Map).ToList();
    public async Task<DraftItem> CreateAsync(Actor a, Guid templateId, string name, Dictionary<string, string?> fields, CancellationToken ct)
    {
        var template = db.Templates.FirstOrDefault(x => x.Id == templateId && x.Status == ContentStatus.Published) ?? throw new NotFoundException("Shablon topilmadi.");
        var content = template.Body;
        foreach (var field in fields) content = content.Replace("{{" + field.Key + "}}", string.IsNullOrWhiteSpace(field.Value) ? $"[TO‘LDIRING: {field.Key}]" : field.Value);
        var draft = new Draft(a.WorkspaceId, a.UserId, templateId, name, JsonSerializer.Serialize(fields), content); db.Add(draft); await db.SaveChangesAsync(ct); return Map(draft);
    }
    private static DraftItem Map(Draft x) => new(x.Id, x.TemplateId, x.Name, x.DataJson, x.RenderedContent, x.CreatedAt);
}
