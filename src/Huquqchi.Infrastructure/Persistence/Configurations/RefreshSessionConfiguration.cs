using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class RefreshSessionConfiguration : BaseEntityConfiguration<RefreshSession>
{
    public override void Configure(EntityTypeBuilder<RefreshSession> builder)
    {
        base.Configure(builder);
        builder.ToTable("refresh_session");
        builder.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ReplacedByTokenHash).HasMaxLength(64);
        builder.Property(x => x.Device).HasMaxLength(120);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.HasIndex(x => x.TokenHash).IsUnique();
        builder.HasIndex(x => new { x.FamilyId, x.RevokedAt });
        builder.HasIndex(x => new { x.UserId, x.RevokedAt });
        builder.HasIndex(x => x.ExpiresAt);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class OtpDeliveryRequestConfiguration : BaseEntityConfiguration<OtpDeliveryRequest>
{
    public override void Configure(EntityTypeBuilder<OtpDeliveryRequest> builder)
    {
        base.Configure(builder);
        builder.ToTable("otp_delivery_request");
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Channel).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.LastError).HasMaxLength(500);
        builder.HasIndex(x => new { x.Status, x.Channel, x.CreatedAt });
        builder.HasIndex(x => new { x.Phone, x.CreatedAt });
    }
}
