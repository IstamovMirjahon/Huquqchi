namespace Huquqchi.Application;

public interface IAuthService
{
    Task<Result<RequestCodeResponse>> RequestCodeAsync(RequestCodeCommand command, CancellationToken cancellationToken);
    Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command, CancellationToken cancellationToken);
    Task<Result<AuthResponse>> RefreshAsync(RefreshTokenCommand command, CancellationToken cancellationToken);
    Task<Result> LogoutAsync(LogoutCommand command, CancellationToken cancellationToken);
    Task<Result<IReadOnlyList<SessionItem>>> ListSessionsAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result> RevokeSessionAsync(Actor actor, Guid sessionId, CancellationToken cancellationToken);
    Task<Result> LogoutAllAsync(Actor actor, CancellationToken cancellationToken);
}
