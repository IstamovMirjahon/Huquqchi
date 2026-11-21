namespace Huquqchi.Application;

/// <summary>Everything that goes into an access token's claims.</summary>
public sealed record AccessTokenSubject(Guid UserId, Guid WorkspaceId, string Role, string? LawyerStatus, Guid SessionId);

public interface ITokenService
{
    IssuedAccessToken Create(AccessTokenSubject subject);
}
