namespace Huquqchi.Application;

public interface ITokenService
{
    IssuedAccessToken Create(Guid userId, Guid workspaceId, string role);
}
