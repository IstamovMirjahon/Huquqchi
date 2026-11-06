using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class LegalDocumentConfiguration : BaseEntityConfiguration<LegalDocument>
{
    public override void Configure(EntityTypeBuilder<LegalDocument> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Title).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Number).HasMaxLength(100).IsRequired();
        builder.Property(x => x.OfficialUrl).HasMaxLength(2048).IsRequired();
        builder.HasIndex(x => new { x.Number, x.Status });
    }
}

internal sealed class LegalVersionConfiguration : BaseEntityConfiguration<LegalVersion>
{
    public override void Configure(EntityTypeBuilder<LegalVersion> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.SourceUrl).HasMaxLength(2048).IsRequired();
        builder.HasIndex(x => new { x.LegalDocumentId, x.EffectiveFrom }).IsUnique();
        builder.HasOne<LegalDocument>().WithMany().HasForeignKey(x => x.LegalDocumentId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class LegalSectionConfiguration : BaseEntityConfiguration<LegalSection>
{
    public override void Configure(EntityTypeBuilder<LegalSection> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Number).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Text).HasColumnType("text").IsRequired();
        builder.HasIndex(x => new { x.LegalVersionId, x.Number }).IsUnique();
        builder.HasOne<LegalVersion>().WithMany().HasForeignKey(x => x.LegalVersionId).OnDelete(DeleteBehavior.Cascade);
    }
}
