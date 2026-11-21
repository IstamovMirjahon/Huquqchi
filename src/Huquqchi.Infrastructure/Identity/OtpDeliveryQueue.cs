using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;

namespace Huquqchi.Infrastructure;

/// <summary>
/// PostgreSQL outbox claim. <c>FOR UPDATE SKIP LOCKED</c> lets several bot replicas drain the queue
/// without ever claiming the same row; the returned entities are tracked, so the caller saves the outcome.
/// </summary>
public sealed class OtpDeliveryQueue(AppDbContext dbContext, TimeProvider timeProvider) : IOtpDeliveryQueue
{
    public async Task<IReadOnlyList<OtpDeliveryRequest>> ClaimAsync(OtpDeliveryChannel channel, int maxCount,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var pending = OtpDeliveryStatus.Pending.ToString();
        var processing = OtpDeliveryStatus.Processing.ToString();
        var channelName = channel.ToString();

        return await dbContext.OtpDeliveryRequests.FromSql($"""
            UPDATE otp_delivery_request
            SET status = {processing}, attempts = attempts + 1, updated_at = {now}
            WHERE id IN (
                SELECT id FROM otp_delivery_request
                WHERE status = {pending} AND channel = {channelName}
                ORDER BY created_at
                LIMIT {maxCount}
                FOR UPDATE SKIP LOCKED)
            RETURNING *
            """).ToListAsync(cancellationToken);
    }
}
