using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class AuditEventConfiguration : BaseEntityConfiguration<AuditEvent>
{
    public override void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ResourceType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ResourceId).HasMaxLength(100);
        builder.HasIndex(x => new { x.WorkspaceId, x.CreatedAt });
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.SetNull);
    }
}
