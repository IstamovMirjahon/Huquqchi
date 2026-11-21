using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Huquqchi.Application;

namespace Huquqchi.Infrastructure;

/// <summary>
/// HMAC-SHA256 signed download links: <c>{base}/api/v1/files/{id}/content?expires=…&amp;sig=…</c>.
/// Behaves like an S3/MinIO presigned URL, so switching storage later does not change the contract.
/// </summary>
public sealed class HmacFileUrlSigner(string publicBaseUrl, string signingKey, TimeSpan lifetime) : IFileUrlSigner
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(signingKey);
    private readonly string _baseUrl = publicBaseUrl.TrimEnd('/');

    public TimeSpan Lifetime => lifetime;

    public string CreateUrl(Guid fileId, DateTimeOffset now)
    {
        var expires = now.Add(lifetime).ToUnixTimeSeconds();
        return $"{_baseUrl}/api/v1/files/{fileId}/content?expires={expires}&sig={Sign(fileId, expires)}";
    }

    public bool IsValid(Guid fileId, long expiresUnixSeconds, string? signature, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(signature) || expiresUnixSeconds <= now.ToUnixTimeSeconds()) return false;
        // Reject links that claim a longer life than we ever issue.
        if (expiresUnixSeconds > now.Add(lifetime).AddMinutes(1).ToUnixTimeSeconds()) return false;
        var expected = Encoding.ASCII.GetBytes(Sign(fileId, expiresUnixSeconds));
        var actual = Encoding.ASCII.GetBytes(signature);
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }

    private string Sign(Guid fileId, long expires)
    {
        var payload = Encoding.UTF8.GetBytes($"{fileId:N}:{expires.ToString(CultureInfo.InvariantCulture)}");
        return Convert.ToHexString(HMACSHA256.HashData(_key, payload)).ToLowerInvariant();
    }
}
