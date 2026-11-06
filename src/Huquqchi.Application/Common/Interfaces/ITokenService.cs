namespace Huquqchi.Application;

public interface ITokenService
{
    string Create(Guid userId, Guid workspaceId, string role);
}
