using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record VerifyCodeCommand(string Phone, string Code, string Name, WorkspaceKind WorkspaceKind);
public sealed record AuthResponse(string AccessToken, Guid UserId, Guid WorkspaceId, string Role);
public sealed record IssuedOneTimeCode(string Code, DateTimeOffset ExpiresAt);
