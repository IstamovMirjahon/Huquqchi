using System.Security.Cryptography;
using System.Text;
using Huquqchi.Application;

namespace Huquqchi.Infrastructure;

public sealed class RefreshTokenFactory(TimeSpan lifetime) : IRefreshTokenFactory
{
    public IssuedRefreshToken Create()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return new IssuedRefreshToken(token, Hash(token), DateTimeOffset.UtcNow.Add(lifetime));
    }

    public string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
