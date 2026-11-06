namespace Huquqchi.Application;

public interface IFileStorage
{
    Task<(string Key, string Sha256)> SaveAsync(Stream stream, string extension, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string key, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}
