namespace Huquqchi.Application;

/// <summary>The authenticated caller, built from JWT claims by the API layer.</summary>
/// <param name="Role">Platform role code (<c>client</c>, <c>lawyer</c>, …).</param>
/// <param name="SessionId">Refresh-token family of the current device, when the token carries one.</param>
public sealed record Actor(Guid UserId, Guid WorkspaceId, string Role, Guid? SessionId = null);

/// <summary>Request metadata used for session listings and audit; never trusted for authorization.</summary>
public sealed record ClientInfo(string? UserAgent, string? IpAddress)
{
    public static readonly ClientInfo Unknown = new(null, null);
}
