namespace Huquqchi.Domain;

public sealed class OtpChallenge : Entity
{
    private OtpChallenge() { }

    public OtpChallenge(string phone, OtpDeliveryChannel channel, long externalUserId, DateTimeOffset expiresAt)
    {
        Phone = phone;
        Channel = channel;
        ExternalUserId = externalUserId;
        ExpiresAt = expiresAt;
    }

    public string Phone { get; private set; } = string.Empty;
    public string CodeHash { get; private set; } = string.Empty;
    public OtpDeliveryChannel Channel { get; private set; }
    public long ExternalUserId { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public int Attempts { get; private set; }
    public bool IsUsed { get; private set; }

    public void SetCodeHash(string codeHash) => CodeHash = codeHash;

    public void RegisterFailedAttempt()
    {
        Attempts++;
        Touch();
    }

    public void MarkUsed()
    {
        IsUsed = true;
        Touch();
    }
}
