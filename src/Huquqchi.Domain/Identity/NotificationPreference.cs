namespace Huquqchi.Domain;

/// <summary>Per-user notification channel and type switches (BACKEND_API.md §2.4).</summary>
public sealed class NotificationPreference : Entity
{
    public static readonly IReadOnlyList<string> Channels = ["inApp", "telegram", "push", "email"];

    public static readonly IReadOnlyList<string> Types =
        ["order_message", "consultation_reminder", "offer_received", "job_matched", "analysis_ready", "marketing"];

    private NotificationPreference() { }

    public NotificationPreference(Guid userId)
    {
        UserId = userId;
        ChannelSettings = Defaults(Channels, off: "email");
        TypeSettings = Defaults(Types, off: "marketing");
    }

    public Guid UserId { get; private set; }
    public Dictionary<string, bool> ChannelSettings { get; private set; } = [];
    public Dictionary<string, bool> TypeSettings { get; private set; } = [];

    /// <summary>Replaces known switches; unknown keys are rejected by the caller, missing keys keep their value.</summary>
    public void Update(IReadOnlyDictionary<string, bool> channels, IReadOnlyDictionary<string, bool> types)
    {
        ChannelSettings = Merge(ChannelSettings, Channels, channels);
        TypeSettings = Merge(TypeSettings, Types, types);
        Touch();
    }

    private static Dictionary<string, bool> Defaults(IEnumerable<string> keys, string off) =>
        keys.ToDictionary(x => x, x => x != off);

    private static Dictionary<string, bool> Merge(Dictionary<string, bool> current, IEnumerable<string> known,
        IReadOnlyDictionary<string, bool> changes) =>
        known.ToDictionary(x => x, x => changes.TryGetValue(x, out var value) ? value : current.GetValueOrDefault(x, true));
}
