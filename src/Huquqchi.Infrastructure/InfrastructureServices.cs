using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Huquqchi.Application;
using Microsoft.IdentityModel.Tokens;

namespace Huquqchi.Infrastructure;

public sealed class JwtTokenService(string issuer, string audience, string key) : ITokenService
{
    public string Create(Guid userId, Guid workspaceId, string role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("workspace_id", workspaceId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(issuer, audience, claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: credentials));
    }
}

public sealed class LocalFileStorage(string root) : IFileStorage
{
    public async Task<(string Key, string Sha256)> SaveAsync(Stream stream, string extension, CancellationToken ct)
    {
        Directory.CreateDirectory(root);
        var key = $"{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var path = SafePath(key); Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var file = File.Create(path); using var sha = SHA256.Create();
        var buffer = new byte[81920]; int read;
        while ((read = await stream.ReadAsync(buffer, ct)) > 0) { await file.WriteAsync(buffer.AsMemory(0, read), ct); sha.TransformBlock(buffer, 0, read, null, 0); }
        sha.TransformFinalBlock([], 0, 0);
        return (key.Replace('\\', '/'), Convert.ToHexString(sha.Hash!).ToLowerInvariant());
    }
    public Task<Stream> OpenReadAsync(string key, CancellationToken ct) => Task.FromResult<Stream>(File.OpenRead(SafePath(key)));
    public Task DeleteAsync(string key, CancellationToken ct) { var path = SafePath(key); if (File.Exists(path)) File.Delete(path); return Task.CompletedTask; }
    private string SafePath(string key)
    {
        var fullRoot = Path.GetFullPath(root); var path = Path.GetFullPath(Path.Combine(fullRoot, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Invalid storage key.");
        return path;
    }
}

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (!db.TemplateSet.Any())
        {
            db.TemplateSet.AddRange(
                new("rental", "Ijara shartnomasi", "Shartnoma", "{\"fields\":[\"landlord\",\"tenant\",\"subject\",\"price\",\"term\"]}", "IJARA SHARTNOMASI\nIjaraga beruvchi: {{landlord}}\nIjarachi: {{tenant}}\nObyekt: {{subject}}\nNarx: {{price}}\nMuddat: {{term}}"),
                new("service", "Xizmat ko‘rsatish shartnomasi", "Shartnoma", "{\"fields\":[\"provider\",\"customer\",\"service\",\"price\",\"term\"]}", "XIZMAT KO‘RSATISH SHARTNOMASI\nIjrochi: {{provider}}\nBuyurtmachi: {{customer}}\nXizmat: {{service}}\nNarx: {{price}}\nMuddat: {{term}}"),
                new("sale", "Oldi-sotdi shartnomasi", "Shartnoma", "{\"fields\":[\"seller\",\"buyer\",\"subject\",\"price\"]}", "OLDI-SOTDI SHARTNOMASI\nSotuvchi: {{seller}}\nXaridor: {{buyer}}\nPredmet: {{subject}}\nNarx: {{price}}"));
        }
        await db.SaveChangesAsync(ct);
    }
}
