namespace Huquqchi.Application;

public enum MalwareScanStatus { Clean, Infected, NotConfigured, Failed }

public sealed record MalwareScanResult(MalwareScanStatus Status, string? Signature = null);

/// <summary>Antivirus port (ClamAV in Infrastructure). Must leave the stream position undefined.</summary>
public interface IMalwareScanner
{
    Task<MalwareScanResult> ScanAsync(Stream content, CancellationToken cancellationToken);
}

/// <summary>
/// Creates and checks short-lived download links, so files can be fetched by a browser
/// without exposing a bearer token in a URL.
/// </summary>
public interface IFileUrlSigner
{
    TimeSpan Lifetime { get; }
    string CreateUrl(Guid fileId, DateTimeOffset now);
    bool IsValid(Guid fileId, long expiresUnixSeconds, string? signature, DateTimeOffset now);
}
