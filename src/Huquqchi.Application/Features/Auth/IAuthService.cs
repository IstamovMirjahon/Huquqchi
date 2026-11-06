namespace Huquqchi.Application;

public interface IAuthService
{
    Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command, CancellationToken cancellationToken);
    Task<Result<AuthResponse>> RefreshAsync(RefreshTokenCommand command, CancellationToken cancellationToken);
    Task<Result> LogoutAsync(LogoutCommand command, CancellationToken cancellationToken);
}
