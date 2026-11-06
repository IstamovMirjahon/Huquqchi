using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class ConversationConfiguration : BaseEntityConfiguration<Conversation>
{
    public override void Configure(EntityTypeBuilder<Conversation> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => new { x.WorkspaceId, x.IsDeleted });
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class MessageConfiguration : BaseEntityConfiguration<Message>
{
    public override void Configure(EntityTypeBuilder<Message> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Content).HasColumnType("text").IsRequired();
        builder.HasIndex(x => new { x.ConversationId, x.CreatedAt });
        builder.HasOne<Conversation>().WithMany().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CitationConfiguration : BaseEntityConfiguration<Citation>
{
    public override void Configure(EntityTypeBuilder<Citation> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Locator).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Excerpt).HasColumnType("text").IsRequired();
        builder.HasOne<Message>().WithMany().HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<LegalVersion>().WithMany().HasForeignKey(x => x.LegalVersionId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class ConversationDocumentConfiguration : BaseEntityConfiguration<ConversationDocument>
{
    public override void Configure(EntityTypeBuilder<ConversationDocument> builder)
    {
        base.Configure(builder);
        builder.HasIndex(x => new { x.ConversationId, x.DocumentId }).IsUnique();
        builder.HasOne<Conversation>().WithMany().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<UploadedDocument>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
    }
}
