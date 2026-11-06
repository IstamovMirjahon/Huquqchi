using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record VerifyCodeCommand(string Phone, string Code, string Name, WorkspaceKind WorkspaceKind);
public sealed record RefreshTokenCommand(string RefreshToken);
public sealed record LogoutCommand(string RefreshToken);
public sealed record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);
public sealed record IssuedRefreshToken(string Token, string TokenHash, DateTimeOffset ExpiresAt);
public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    Guid UserId,
    Guid WorkspaceId,
    string Role);
public sealed record IssuedOneTimeCode(string Code, DateTimeOffset ExpiresAt);
