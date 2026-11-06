using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IOneTimeCodeService
{
    Task<Result<IssuedOneTimeCode>> IssueAsync(
        string phone,
        OtpDeliveryChannel channel,
        long externalUserId,
        CancellationToken cancellationToken);

    Task<Result> VerifyAsync(string phone, string code, CancellationToken cancellationToken);
}
