using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Huquqchi.Application;
using Microsoft.IdentityModel.Tokens;

namespace Huquqchi.Infrastructure;

public sealed class JwtTokenService(string issuer, string audience, string key, TimeSpan lifetime) : ITokenService
{
    public const string WorkspaceClaim = "workspace_id";
    public const string LawyerStatusClaim = "lawyer_status";
    public const string SessionClaim = "session_id";

    public IssuedAccessToken Create(AccessTokenSubject subject)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, subject.UserId.ToString()),
            new(WorkspaceClaim, subject.WorkspaceId.ToString()),
            new(ClaimTypes.Role, subject.Role),
            new(SessionClaim, subject.SessionId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (subject.LawyerStatus is not null) claims.Add(new Claim(LawyerStatusClaim, subject.LawyerStatus));

        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.Add(lifetime);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);
        return new IssuedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
