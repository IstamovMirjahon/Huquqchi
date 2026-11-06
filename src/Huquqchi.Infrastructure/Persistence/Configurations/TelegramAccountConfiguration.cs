using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class TelegramAccountConfiguration : BaseEntityConfiguration<TelegramAccount>
{
    public override void Configure(EntityTypeBuilder<TelegramAccount> builder)
    {
        base.Configure(builder);
        builder.ToTable("telegram_account");
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.TelegramUserId).IsUnique();
        builder.HasIndex(x => x.Phone).IsUnique();
    }
}
