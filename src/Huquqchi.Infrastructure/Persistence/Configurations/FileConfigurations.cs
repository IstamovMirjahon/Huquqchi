using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class StoredFileConfiguration : BaseEntityConfiguration<StoredFile>
{
    public override void Configure(EntityTypeBuilder<StoredFile> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Purpose).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.ScanStatus).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Mime).HasMaxLength(128).IsRequired();
        builder.Property(x => x.StorageKey).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Sha256).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => new { x.OwnerId, x.IsDeleted });
        builder.HasIndex(x => x.Sha256);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
    }
}
