using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class UserConfiguration : BaseEntityConfiguration<User>
{
    public override void Configure(EntityTypeBuilder<User> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Phone).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Language).HasMaxLength(16).IsRequired();
        builder.HasIndex(x => x.Phone).IsUnique();
    }
}

internal sealed class WorkspaceConfiguration : BaseEntityConfiguration<Workspace>
{
    public override void Configure(EntityTypeBuilder<Workspace> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
    }
}

internal sealed class MembershipConfiguration : BaseEntityConfiguration<Membership>
{
    public override void Configure(EntityTypeBuilder<Membership> builder)
    {
        base.Configure(builder);
        builder.HasIndex(x => new { x.UserId, x.WorkspaceId }).IsUnique();
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ConsentConfiguration : BaseEntityConfiguration<Consent>
{
    public override void Configure(EntityTypeBuilder<Consent> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Policy).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Version).HasMaxLength(32).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.Policy, x.Version }).IsUnique();
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
