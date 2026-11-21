namespace Huquqchi.Domain;

/// <summary>
/// One refresh token. Rotation creates a new row in the same <see cref="FamilyId"/>, so a
/// family is one signed-in device ("session" in the API) and the family id is its public id.
/// </summary>
public sealed class RefreshSession : Entity
{
    private RefreshSession() { }

    public RefreshSession(Guid userId, Guid workspaceId, Guid familyId, string tokenHash,
        DateTimeOffset expiresAt, string? device = null, string? ipAddress = null,
        DateTimeOffset? sessionStartedAt = null)
    {
        UserId = userId;
        WorkspaceId = workspaceId;
        FamilyId = familyId;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
        Device = device;
        IpAddress = ipAddress;
        SessionStartedAt = sessionStartedAt ?? CreatedAt;
        LastActiveAt = CreatedAt;
    }

    public Guid UserId { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public Guid FamilyId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }
    public string? Device { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTimeOffset SessionStartedAt { get; private set; }
    public DateTimeOffset LastActiveAt { get; private set; }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;

    public void Rotate(string replacementTokenHash, DateTimeOffset now)
    {
        RevokedAt = now;
        ReplacedByTokenHash = replacementTokenHash;
        Touch();
    }

    public void Revoke(DateTimeOffset now)
    {
        if (RevokedAt is not null) return;
        RevokedAt = now;
        Touch();
    }
}
