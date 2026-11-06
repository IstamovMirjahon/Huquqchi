using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class UploadedDocumentConfiguration : BaseEntityConfiguration<UploadedDocument>
{
    public override void Configure(EntityTypeBuilder<UploadedDocument> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Tags).HasMaxLength(500);
        builder.HasIndex(x => new { x.WorkspaceId, x.IsDeleted });
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DocumentVersionConfiguration : BaseEntityConfiguration<DocumentVersion>
{
    public override void Configure(EntityTypeBuilder<DocumentVersion> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.StorageKey).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Sha256).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ExtractedText).HasColumnType("text");
        builder.HasIndex(x => new { x.DocumentId, x.Version }).IsUnique();
        builder.HasIndex(x => x.Sha256);
        builder.HasOne<UploadedDocument>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class AnalysisConfiguration : BaseEntityConfiguration<Analysis>
{
    public override void Configure(EntityTypeBuilder<Analysis> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Purpose).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.UserRole).HasMaxLength(160);
        builder.Property(x => x.Summary).HasColumnType("text");
        builder.Property(x => x.Error).HasColumnType("text");
        builder.HasIndex(x => new { x.WorkspaceId, x.CreatedAt });
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<DocumentVersion>().WithMany().HasForeignKey(x => x.DocumentVersionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class FindingConfiguration : BaseEntityConfiguration<Finding>
{
    public override void Configure(EntityTypeBuilder<Finding> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Title).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Explanation).HasColumnType("text").IsRequired();
        builder.Property(x => x.Excerpt).HasColumnType("text");
        builder.Property(x => x.Locator).HasMaxLength(100);
        builder.HasOne<Analysis>().WithMany().HasForeignKey(x => x.AnalysisId).OnDelete(DeleteBehavior.Cascade);
    }
}
