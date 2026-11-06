namespace Huquqchi.Domain;

public sealed class RefreshSession : Entity
{
    private RefreshSession() { }

    public RefreshSession(Guid userId, Guid workspaceId, Guid familyId, string tokenHash,
        DateTimeOffset expiresAt)
    {
        UserId = userId;
        WorkspaceId = workspaceId;
        FamilyId = familyId;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid UserId { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public Guid FamilyId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

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
