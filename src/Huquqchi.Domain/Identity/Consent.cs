namespace Huquqchi.Domain;

public sealed class Consent : Entity
{
    private Consent() { }
    public Consent(Guid userId, string policy, string version)
    {
        UserId = userId;
        Policy = policy;
        Version = version;
        AcceptedAt = DateTimeOffset.UtcNow;
    }

    public Guid UserId { get; private set; }
    public string Policy { get; private set; } = "";
    public string Version { get; private set; } = "";
    public DateTimeOffset AcceptedAt { get; private set; }
}
