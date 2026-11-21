using Huquqchi.Domain;

namespace Huquqchi.Application;

/// <summary>
/// Drains the OTP outbox for every channel the host has a sender for. The code is issued here,
/// right before sending, so it exists in plain text only in memory of the sending process.
/// </summary>
public sealed class OtpDeliveryProcessor(
    IOtpDeliveryQueue queue,
    IOneTimeCodeService oneTimeCodeService,
    IEnumerable<IOtpSender> senders,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IOtpDeliveryProcessor
{
    private const int BatchSize = 20;

    public async Task<int> ProcessPendingAsync(CancellationToken cancellationToken)
    {
        var handled = 0;
        foreach (var sender in senders)
        {
            var batch = await queue.ClaimAsync(sender.Channel, BatchSize, cancellationToken);
            foreach (var request in batch)
            {
                await DeliverAsync(sender, request, cancellationToken);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                handled++;
            }
        }

        return handled;
    }

    private async Task DeliverAsync(IOtpSender sender, OtpDeliveryRequest request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        if (request.IsExpired(now))
        {
            request.MarkExpired();
            return;
        }

        var issued = await oneTimeCodeService.IssueAsync(request.Phone, request.Channel,
            request.ExternalUserId ?? 0, cancellationToken, enforceCooldown: false);
        if (issued.IsFailure)
        {
            request.MarkFailed(issued.Error.Code, now);
            return;
        }

        var sent = await sender.SendAsync(request, issued.Value, cancellationToken);
        if (sent.IsSuccess) request.MarkSent(timeProvider.GetUtcNow());
        else request.MarkFailed(sent.Error.Code, timeProvider.GetUtcNow());
    }
}
