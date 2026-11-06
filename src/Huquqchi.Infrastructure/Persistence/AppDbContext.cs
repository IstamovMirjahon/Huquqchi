using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;

namespace Huquqchi.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Citation> Citations => Set<Citation>();
    public DbSet<UploadedDocument> UploadedDocuments => Set<UploadedDocument>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<ConversationDocument> ConversationDocuments => Set<ConversationDocument>();
    public DbSet<Analysis> Analyses => Set<Analysis>();
    public DbSet<Finding> Findings => Set<Finding>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();
    public DbSet<LegalVersion> LegalVersions => Set<LegalVersion>();
    public DbSet<LegalSection> LegalSections => Set<LegalSection>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<Draft> Drafts => Set<Draft>();
    public DbSet<Consent> Consents => Set<Consent>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
    public DbSet<TelegramAccount> TelegramAccounts => Set<TelegramAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        foreach (var type in modelBuilder.Model.GetEntityTypes())
            foreach (var property in type.GetProperties())
                property.SetColumnName(ToSnakeCase(property.Name));
        base.OnModelCreating(modelBuilder);
    }

    private static string ToSnakeCase(string value) => string.Concat(value.Select((character, index) =>
        index > 0 && char.IsUpper(character)
            ? "_" + char.ToLowerInvariant(character)
            : char.ToLowerInvariant(character).ToString()));
}
