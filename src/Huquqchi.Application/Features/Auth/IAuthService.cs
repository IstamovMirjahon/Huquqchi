namespace Huquqchi.Application;

public interface IAuthService
{
    Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command, CancellationToken cancellationToken);
}
