namespace Huquqchi.Domain;

/// <summary>
/// Outbox row asking a delivery worker to issue and send a one-time code.
/// The code itself is never stored here: the worker that owns the channel credentials
/// (e.g. the Telegram bot) issues it at send time, so only its hash ever reaches the database.
/// </summary>
public sealed class OtpDeliveryRequest : Entity
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    public const int MaxAttempts = 3;

    private OtpDeliveryRequest() { }

    public OtpDeliveryRequest(string phone, OtpDeliveryChannel channel, long? externalUserId)
    {
        Phone = phone;
        Channel = channel;
        ExternalUserId = externalUserId;
        Status = OtpDeliveryStatus.Pending;
    }

    public string Phone { get; private set; } = string.Empty;
    public OtpDeliveryChannel Channel { get; private set; }

    /// <summary>Recipient id on the channel; for Telegram the user id, which is also the private chat id.</summary>
    public long? ExternalUserId { get; private set; }

    public OtpDeliveryStatus Status { get; private set; }
    public int Attempts { get; private set; }
    public string? LastError { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public bool IsExpired(DateTimeOffset now) => CreatedAt.Add(Lifetime) <= now;

    public void BeginAttempt()
    {
        Status = OtpDeliveryStatus.Processing;
        Attempts++;
        Touch();
    }

    public void MarkSent(DateTimeOffset now)
    {
        Status = OtpDeliveryStatus.Sent;
        SentAt = now;
        LastError = null;
        Touch();
    }

    public void MarkFailed(string error, DateTimeOffset now)
    {
        LastError = error.Length > 500 ? error[..500] : error;
        Status = Attempts >= MaxAttempts || IsExpired(now) ? OtpDeliveryStatus.Failed : OtpDeliveryStatus.Pending;
        Touch();
    }

    public void MarkExpired()
    {
        Status = OtpDeliveryStatus.Expired;
        Touch();
    }
}
