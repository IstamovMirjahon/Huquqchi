using Huquqchi.Application;
using Huquqchi.Domain;
using Huquqchi.Infrastructure;

namespace Huquqchi.IntegrationTests;

public sealed class OtpDeliveryProcessorTests
{
    [Fact]
    public async Task Pending_request_is_issued_sent_and_marked_sent()
    {
        var (processor, request, sender) = Create(new OtpDeliveryRequest("+998901112233", OtpDeliveryChannel.Telegram, 42));

        Assert.Equal(1, await processor.ProcessPendingAsync(default));

        Assert.Equal(OtpDeliveryStatus.Sent, request.Status);
        Assert.NotNull(request.SentAt);
        var (chatId, code) = Assert.Single(sender.Sent);
        Assert.Equal(42, chatId);
        Assert.Equal("111111", code);
    }

    [Fact]
    public async Task Failed_send_is_retried_until_the_attempt_limit()
    {
        var (processor, request, sender) = Create(new OtpDeliveryRequest("+998901112233", OtpDeliveryChannel.Telegram, 42));
        sender.Fail = true;

        for (var attempt = 1; attempt < OtpDeliveryRequest.MaxAttempts; attempt++)
        {
            await processor.ProcessPendingAsync(default);
            Assert.Equal(OtpDeliveryStatus.Pending, request.Status);
        }

        await processor.ProcessPendingAsync(default);
        Assert.Equal(OtpDeliveryStatus.Failed, request.Status);
        Assert.Equal("otp.telegram_send_failed", request.LastError);
    }

    [Fact]
    public async Task Expired_request_is_not_sent()
    {
        var request = new OtpDeliveryRequest("+998901112233", OtpDeliveryChannel.Telegram, 42);
        var (processor, _, sender) = Create(request, DateTimeOffset.UtcNow.Add(OtpDeliveryRequest.Lifetime).AddSeconds(1));

        await processor.ProcessPendingAsync(default);

        Assert.Equal(OtpDeliveryStatus.Expired, request.Status);
        Assert.Empty(sender.Sent);
    }

    [Fact]
    public void Signed_file_urls_expire_and_are_bound_to_the_file()
    {
        var signer = new HmacFileUrlSigner("https://api.huquqchi.uz", "unit-test-signing-key-long-enough-1234", TimeSpan.FromMinutes(5));
        var now = DateTimeOffset.UtcNow;
        var fileId = Guid.NewGuid();
        var query = System.Web.HttpUtility.ParseQueryString(new Uri(signer.CreateUrl(fileId, now)).Query);
        var expires = long.Parse(query["expires"]!);
        var sig = query["sig"];

        Assert.True(signer.IsValid(fileId, expires, sig, now));
        Assert.False(signer.IsValid(Guid.NewGuid(), expires, sig, now));
        Assert.False(signer.IsValid(fileId, expires + 60, sig, now));
        Assert.False(signer.IsValid(fileId, expires, sig, now.AddMinutes(6)));
    }

    private static (OtpDeliveryProcessor, OtpDeliveryRequest, FakeSender) Create(OtpDeliveryRequest request,
        DateTimeOffset? now = null)
    {
        var sender = new FakeSender();
        var processor = new OtpDeliveryProcessor(new FakeQueue(request), new TestOneTimeCodeService(), [sender],
            new TestUnitOfWork(), new FixedTime(now ?? DateTimeOffset.UtcNow));
        return (processor, request, sender);
    }

    private sealed class FakeQueue(OtpDeliveryRequest request) : IOtpDeliveryQueue
    {
        public Task<IReadOnlyList<OtpDeliveryRequest>> ClaimAsync(OtpDeliveryChannel channel, int maxCount,
            CancellationToken cancellationToken)
        {
            if (request.Status != OtpDeliveryStatus.Pending || request.Channel != channel)
                return Task.FromResult<IReadOnlyList<OtpDeliveryRequest>>([]);
            request.BeginAttempt();
            return Task.FromResult<IReadOnlyList<OtpDeliveryRequest>>([request]);
        }
    }

    private sealed class FakeSender : IOtpSender
    {
        public bool Fail { get; set; }
        public List<(long ChatId, string Code)> Sent { get; } = [];
        public OtpDeliveryChannel Channel => OtpDeliveryChannel.Telegram;

        public Task<Result> SendAsync(OtpDeliveryRequest request, IssuedOneTimeCode code, CancellationToken cancellationToken)
        {
            if (Fail) return Task.FromResult(Result.Failure(new Error("otp.telegram_send_failed", "blocked", ErrorType.Unavailable)));
            Sent.Add((request.ExternalUserId!.Value, code.Code));
            return Task.FromResult(Result.Success());
        }
    }

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
