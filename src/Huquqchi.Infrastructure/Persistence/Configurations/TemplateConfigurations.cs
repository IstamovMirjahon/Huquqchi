using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class TemplateConfiguration : BaseEntityConfiguration<Template>
{
    public override void Configure(EntityTypeBuilder<Template> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Code).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();
        builder.Property(x => x.SchemaJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Body).HasColumnType("text").IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
    }
}

internal sealed class DraftConfiguration : BaseEntityConfiguration<Draft>
{
    public override void Configure(EntityTypeBuilder<Draft> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.DataJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.RenderedContent).HasColumnType("text").IsRequired();
        builder.HasIndex(x => new { x.WorkspaceId, x.CreatedAt });
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Template>().WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.Restrict);
    }
}
