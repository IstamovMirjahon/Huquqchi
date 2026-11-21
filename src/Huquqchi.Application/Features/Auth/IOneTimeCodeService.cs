using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IOneTimeCodeService
{
    /// <param name="enforceCooldown">
    /// False when the caller already enforced request limits (the delivery outbox does this
    /// when the request is queued), so a retry after a failed send is not blocked by its own earlier attempt.
    /// </param>
    Task<Result<IssuedOneTimeCode>> IssueAsync(
        string phone,
        OtpDeliveryChannel channel,
        long externalUserId,
        CancellationToken cancellationToken,
        bool enforceCooldown = true);

    Task<Result> VerifyAsync(string phone, string code, CancellationToken cancellationToken);
}

/// <summary>Sends an already-issued code over one channel. Implemented by the host that owns the channel credentials.</summary>
public interface IOtpSender
{
    OtpDeliveryChannel Channel { get; }
    Task<Result> SendAsync(OtpDeliveryRequest request, IssuedOneTimeCode code, CancellationToken cancellationToken);
}

/// <summary>Atomically claims pending delivery requests so that several workers never send the same code twice.</summary>
public interface IOtpDeliveryQueue
{
    Task<IReadOnlyList<OtpDeliveryRequest>> ClaimAsync(OtpDeliveryChannel channel, int maxCount, CancellationToken cancellationToken);
}

public interface IOtpDeliveryProcessor
{
    /// <returns>Number of requests handled (sent, failed or expired).</returns>
    Task<int> ProcessPendingAsync(CancellationToken cancellationToken);
}
