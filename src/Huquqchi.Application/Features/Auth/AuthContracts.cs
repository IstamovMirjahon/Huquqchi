using Huquqchi.Domain;

namespace Huquqchi.Application;

/// <summary>Auth configuration supplied by the host.</summary>
public sealed record AuthSettings(string? TelegramBotUrl, bool SmsEnabled);

public sealed record RequestCodeCommand(string Phone, string? Channel);

public sealed record RequestCodeResponse(
    string Message,
    string DeliveryChannel,
    string? TelegramBotUrl,
    bool IsNewUser,
    int ResendAfterSeconds,
    bool CodeSent);

public sealed record VerifyCodeCommand(
    string Phone,
    string Code,
    string? Name,
    WorkspaceKind WorkspaceKind,
    string? Role = null,
    bool AcceptTerms = false,
    ClientInfo? Client = null);

public sealed record RefreshTokenCommand(string RefreshToken, ClientInfo? Client = null);
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
    string Role,
    MeResponse User);

public sealed record SessionItem(
    Guid Id,
    string? Device,
    string? Ip,
    string? City,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastActiveAt,
    bool IsCurrent);

public sealed record IssuedOneTimeCode(string Code, DateTimeOffset ExpiresAt);
