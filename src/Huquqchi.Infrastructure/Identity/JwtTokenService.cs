using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Huquqchi.Application;
using Microsoft.IdentityModel.Tokens;

namespace Huquqchi.Infrastructure;

public sealed class JwtTokenService(string issuer, string audience, string key, TimeSpan lifetime) : ITokenService
{
    public IssuedAccessToken Create(Guid userId, Guid workspaceId, string role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("workspace_id", workspaceId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.Add(lifetime);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);
        return new IssuedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
