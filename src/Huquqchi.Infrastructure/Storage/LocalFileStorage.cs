using System.Security.Cryptography;
using Huquqchi.Application;

namespace Huquqchi.Infrastructure;

public sealed class LocalFileStorage(string root) : IFileStorage
{
    public async Task<(string Key, string Sha256)> SaveAsync(Stream stream, string extension, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(root);
        var key = $"{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var path = SafePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var file = File.Create(path);
        using var sha = SHA256.Create();
        var buffer = new byte[81920];
        int read;
        while ((read = await stream.ReadAsync(buffer, cancellationToken)) > 0)
        {
            await file.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            sha.TransformBlock(buffer, 0, read, null, 0);
        }
        sha.TransformFinalBlock([], 0, 0);
        return (key.Replace('\\', '/'), Convert.ToHexString(sha.Hash!).ToLowerInvariant());
    }

    public Task<Stream> OpenReadAsync(string key, CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(File.OpenRead(SafePath(key)));

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var path = SafePath(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    private string SafePath(string key)
    {
        var fullRoot = Path.GetFullPath(root);
        var path = Path.GetFullPath(Path.Combine(fullRoot, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid storage key.");
        return path;
    }
}
