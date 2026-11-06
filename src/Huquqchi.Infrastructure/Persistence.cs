using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;

namespace Huquqchi.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> UserSet => Set<User>();
    public DbSet<Workspace> WorkspaceSet => Set<Workspace>();
    public DbSet<Membership> MembershipSet => Set<Membership>();
    public DbSet<Conversation> ConversationSet => Set<Conversation>();
    public DbSet<Message> MessageSet => Set<Message>();
    public DbSet<Citation> CitationSet => Set<Citation>();
    public DbSet<UploadedDocument> UploadedDocumentSet => Set<UploadedDocument>();
    public DbSet<DocumentVersion> DocumentVersionSet => Set<DocumentVersion>();
    public DbSet<ConversationDocument> ConversationDocumentSet => Set<ConversationDocument>();
    public DbSet<Analysis> AnalysisSet => Set<Analysis>();
    public DbSet<Finding> FindingSet => Set<Finding>();
    public DbSet<LegalDocument> LegalDocumentSet => Set<LegalDocument>();
    public DbSet<LegalVersion> LegalVersionSet => Set<LegalVersion>();
    public DbSet<LegalSection> LegalSectionSet => Set<LegalSection>();
    public DbSet<Template> TemplateSet => Set<Template>();
    public DbSet<Draft> DraftSet => Set<Draft>();
    public DbSet<Consent> ConsentSet => Set<Consent>();
    public DbSet<AuditEvent> AuditEventSet => Set<AuditEvent>();

    IQueryable<User> IAppDbContext.Users => UserSet;
    IQueryable<Workspace> IAppDbContext.Workspaces => WorkspaceSet;
    IQueryable<Membership> IAppDbContext.Memberships => MembershipSet;
    IQueryable<Conversation> IAppDbContext.Conversations => ConversationSet;
    IQueryable<Message> IAppDbContext.Messages => MessageSet;
    IQueryable<Citation> IAppDbContext.Citations => CitationSet;
    IQueryable<UploadedDocument> IAppDbContext.UploadedDocuments => UploadedDocumentSet;
    IQueryable<DocumentVersion> IAppDbContext.DocumentVersions => DocumentVersionSet;
    IQueryable<ConversationDocument> IAppDbContext.ConversationDocuments => ConversationDocumentSet;
    IQueryable<Analysis> IAppDbContext.Analyses => AnalysisSet;
    IQueryable<Finding> IAppDbContext.Findings => FindingSet;
    IQueryable<LegalDocument> IAppDbContext.LegalDocuments => LegalDocumentSet;
    IQueryable<LegalVersion> IAppDbContext.LegalVersions => LegalVersionSet;
    IQueryable<LegalSection> IAppDbContext.LegalSections => LegalSectionSet;
    IQueryable<Template> IAppDbContext.Templates => TemplateSet;
    IQueryable<Draft> IAppDbContext.Drafts => DraftSet;
    void IAppDbContext.Add<T>(T entity) => Add(entity);
    void IAppDbContext.Remove<T>(T entity) => Remove(entity);

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        foreach (var type in b.Model.GetEntityTypes())
        {
            type.SetTableName(ToSnake(type.ClrType.Name));
            foreach (var property in type.GetProperties()) property.SetColumnName(ToSnake(property.Name));
        }
        b.Entity<User>().HasIndex(x => x.Phone).IsUnique();
        b.Entity<Membership>().HasIndex(x => new { x.UserId, x.WorkspaceId }).IsUnique();
        b.Entity<ConversationDocument>().HasIndex(x => new { x.ConversationId, x.DocumentId }).IsUnique();
        b.Entity<Template>().HasIndex(x => x.Code).IsUnique();
        b.Entity<UploadedDocument>().HasIndex(x => new { x.WorkspaceId, x.IsDeleted });
        b.Entity<Conversation>().HasIndex(x => new { x.WorkspaceId, x.IsDeleted });
        b.Entity<LegalDocument>().HasIndex(x => new { x.Number, x.Status });
        b.Entity<User>().Property(x => x.Name).HasMaxLength(160);
        b.Entity<User>().Property(x => x.Phone).HasMaxLength(32);
        b.Entity<UploadedDocument>().Property(x => x.Name).HasMaxLength(255);
        b.Entity<DocumentVersion>().Property(x => x.Sha256).HasMaxLength(64);
    }

    private static string ToSnake(string value) => string.Concat(value.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + char.ToLowerInvariant(c) : char.ToLowerInvariant(c).ToString()));
}
