using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class OtpChallengeConfiguration : BaseEntityConfiguration<OtpChallenge>
{
    public override void Configure(EntityTypeBuilder<OtpChallenge> builder)
    {
        base.Configure(builder);
        builder.ToTable("otp_challenge");
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.CodeHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Channel).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasIndex(x => new { x.Phone, x.CreatedAt });
        builder.HasIndex(x => x.ExpiresAt);
    }
}
