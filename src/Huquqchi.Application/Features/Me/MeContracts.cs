namespace Huquqchi.Application;

public sealed record SubscriptionSummary(
    string PlanCode,
    string PlanName,
    string Status,
    DateTimeOffset? CurrentPeriodEnd,
    bool CancelAtPeriodEnd);

public sealed record MeResponse(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    string? AvatarUrl,
    string Language,
    string Role,
    string? LawyerStatus,
    Guid? LawyerProfileId,
    WorkspaceResponse Workspace,
    SubscriptionSummary Subscription,
    IReadOnlyList<UsageItem> Usage,
    int UnreadNotifications,
    DateTimeOffset CreatedAt);

/// <summary>Every field is optional; only provided ones change.</summary>
public sealed record UpdateMeCommand(string? Name, string? Email, string? Language);

public sealed record AvatarResponse(string AvatarUrl);

public sealed record NotificationSettingsDto(
    IReadOnlyDictionary<string, bool> Channels,
    IReadOnlyDictionary<string, bool> Types);

public sealed record DataExportResponse(Guid RequestId, string Message);

public sealed record DeleteAccountCommand(string? Confirm, string? Reason);

public static class SupportedLanguages
{
    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal) { "uz-Latn", "uz-Cyrl", "ru" };
}
