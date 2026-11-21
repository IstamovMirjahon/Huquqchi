using System.Text.Json;
using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Huquqchi.Infrastructure;

internal sealed class UserConfiguration : BaseEntityConfiguration<User>
{
    public override void Configure(EntityTypeBuilder<User> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Phone).HasMaxLength(48).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(254);
        builder.Property(x => x.Language).HasMaxLength(16).IsRequired();
        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Ignore(x => x.IsDeleted);
        builder.Ignore(x => x.CanAuthenticate);
        builder.HasIndex(x => x.Phone).IsUnique();
        builder.HasIndex(x => x.Role);
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

internal sealed class LawyerProfileConfiguration : BaseEntityConfiguration<LawyerProfile>
{
    public override void Configure(EntityTypeBuilder<LawyerProfile> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasIndex(x => x.Status);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class NotificationPreferenceConfiguration : BaseEntityConfiguration<NotificationPreference>
{
    public override void Configure(EntityTypeBuilder<NotificationPreference> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.ChannelSettings).HasColumnType("jsonb").HasConversion(JsonSwitches.Converter, JsonSwitches.Comparer).IsRequired();
        builder.Property(x => x.TypeSettings).HasColumnType("jsonb").HasConversion(JsonSwitches.Converter, JsonSwitches.Comparer).IsRequired();
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class DataExportRequestConfiguration : BaseEntityConfiguration<DataExportRequest>
{
    public override void Configure(EntityTypeBuilder<DataExportRequest> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal static class JsonSwitches
{
    public static readonly Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<Dictionary<string, bool>, string> Converter = new(
        value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
        json => JsonSerializer.Deserialize<Dictionary<string, bool>>(json, (JsonSerializerOptions?)null) ?? new Dictionary<string, bool>());

    public static readonly ValueComparer<Dictionary<string, bool>> Comparer = new(
        (left, right) => left!.Count == right!.Count && !left.Except(right).Any(),
        value => value.Aggregate(0, (hash, pair) => HashCode.Combine(hash, pair.Key, pair.Value)),
        value => new Dictionary<string, bool>(value));
}
