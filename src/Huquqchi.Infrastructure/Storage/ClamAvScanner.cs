using System.Buffers.Binary;
using System.Net.Sockets;
using System.Text;
using Huquqchi.Application;
using Microsoft.Extensions.Logging;

namespace Huquqchi.Infrastructure;

/// <summary>ClamAV daemon client using the clamd <c>INSTREAM</c> protocol over TCP.</summary>
public sealed class ClamAvScanner(string host, int port, ILogger<ClamAvScanner> logger) : IMalwareScanner
{
    private const int ChunkSize = 64 * 1024;
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(30);

    public async Task<MalwareScanResult> ScanAsync(Stream content, CancellationToken cancellationToken)
    {
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(Timeout);
            using var client = new TcpClient();
            await client.ConnectAsync(host, port, timeout.Token);
            await using var stream = client.GetStream();

            await stream.WriteAsync("zINSTREAM\0"u8.ToArray(), timeout.Token);
            var buffer = new byte[ChunkSize];
            var size = new byte[4];
            int read;
            while ((read = await content.ReadAsync(buffer, timeout.Token)) > 0)
            {
                BinaryPrimitives.WriteUInt32BigEndian(size, (uint)read);
                await stream.WriteAsync(size, timeout.Token);
                await stream.WriteAsync(buffer.AsMemory(0, read), timeout.Token);
            }

            BinaryPrimitives.WriteUInt32BigEndian(size, 0);
            await stream.WriteAsync(size, timeout.Token);

            using var reader = new StreamReader(stream, Encoding.ASCII);
            var reply = (await reader.ReadToEndAsync(timeout.Token)).TrimEnd('\0', '\n', ' ');
            if (reply.EndsWith(" OK", StringComparison.Ordinal)) return new MalwareScanResult(MalwareScanStatus.Clean);
            if (reply.EndsWith(" FOUND", StringComparison.Ordinal))
            {
                var signature = reply.Replace("stream:", "", StringComparison.Ordinal).Replace(" FOUND", "", StringComparison.Ordinal).Trim();
                logger.LogWarning("ClamAV blocked an upload: {Signature}", signature);
                return new MalwareScanResult(MalwareScanStatus.Infected, signature);
            }

            logger.LogError("Unexpected ClamAV reply: {Reply}", reply);
            return new MalwareScanResult(MalwareScanStatus.Failed);
        }
        catch (Exception ex) when (ex is SocketException or IOException or OperationCanceledException && !cancellationToken.IsCancellationRequested)
        {
            logger.LogError(ex, "ClamAV is unreachable at {Host}:{Port}", host, port);
            return new MalwareScanResult(MalwareScanStatus.Failed);
        }
    }
}

/// <summary>Used when no ClamAV host is configured: files are accepted and marked <c>Skipped</c> for a later rescan.</summary>
public sealed class NotConfiguredMalwareScanner : IMalwareScanner
{
    public Task<MalwareScanResult> ScanAsync(Stream content, CancellationToken cancellationToken) =>
        Task.FromResult(new MalwareScanResult(MalwareScanStatus.NotConfigured));
}
