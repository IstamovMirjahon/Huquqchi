using System.Security.Cryptography;
using System.Text;
using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.Extensions.Configuration;

namespace Huquqchi.Infrastructure;

public sealed class OneTimeCodeService(IUnitOfWork unitOfWork, IConfiguration configuration) : IOneTimeCodeService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan IssueCooldown = TimeSpan.FromMinutes(1);
    private const int MaxAttempts = 5;

    public async Task<Result<IssuedOneTimeCode>> IssueAsync(
        string phone,
        OtpDeliveryChannel channel,
        long externalUserId,
        CancellationToken cancellationToken,
        bool enforceCooldown = true)
    {
        var normalizedPhone = PhoneNumber.Normalize(phone);
        if (normalizedPhone is null)
            return Result.Failure<IssuedOneTimeCode>(ApplicationErrors.Auth.InvalidPhone);

        var repository = unitOfWork.Repository<OtpChallenge>();
        if (enforceCooldown)
        {
            var latest = (await repository.ListAsync(
                x => x.Phone == normalizedPhone,
                q => q.OrderByDescending(x => x.CreatedAt),
                cancellationToken: cancellationToken)).FirstOrDefault();
            var cooldownEnds = latest?.CreatedAt.Add(IssueCooldown);
            if (cooldownEnds > DateTimeOffset.UtcNow)
                return Result.Failure<IssuedOneTimeCode>(ApplicationErrors.Auth.CodeRateLimited(
                    Math.Max(1, (int)Math.Ceiling((cooldownEnds.Value - DateTimeOffset.UtcNow).TotalSeconds))));
        }

        var hashKey = configuration["Otp:HashKey"];
        if (string.IsNullOrWhiteSpace(hashKey) || hashKey.Length < 32)
            return Result.Failure<IssuedOneTimeCode>(ApplicationErrors.Auth.OtpNotConfigured);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var expiresAt = DateTimeOffset.UtcNow.Add(Lifetime);
        var challenge = new OtpChallenge(normalizedPhone, channel, externalUserId, expiresAt);
        challenge.SetCodeHash(Hash(hashKey, challenge.Id, normalizedPhone, code));
        await repository.AddAsync(challenge, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(new IssuedOneTimeCode(code, expiresAt));
    }

    public async Task<Result> VerifyAsync(string phone, string code, CancellationToken cancellationToken)
    {
        var normalizedPhone = PhoneNumber.Normalize(phone);
        if (normalizedPhone is null || string.IsNullOrWhiteSpace(code))
            return Result.Failure(ApplicationErrors.Auth.InvalidCode);

        var challenges = await unitOfWork.Repository<OtpChallenge>().ListAsync(
            x => x.Phone == normalizedPhone && !x.IsUsed,
            q => q.OrderByDescending(x => x.CreatedAt),
            asTracking: true,
            cancellationToken: cancellationToken);
        var challenge = challenges.FirstOrDefault();
        if (challenge is null) return Result.Failure(ApplicationErrors.Auth.InvalidCode);
        if (challenge.ExpiresAt <= DateTimeOffset.UtcNow) return Result.Failure(ApplicationErrors.Auth.CodeExpired);
        if (challenge.Attempts >= MaxAttempts) return Result.Failure(ApplicationErrors.Auth.TooManyAttempts);

        var hashKey = configuration["Otp:HashKey"];
        if (string.IsNullOrWhiteSpace(hashKey) || hashKey.Length < 32)
            return Result.Failure(ApplicationErrors.Auth.OtpNotConfigured);

        var actual = Convert.FromHexString(Hash(hashKey, challenge.Id, normalizedPhone, code.Trim()));
        var expected = Convert.FromHexString(challenge.CodeHash);
        if (!CryptographicOperations.FixedTimeEquals(actual, expected))
        {
            challenge.RegisterFailedAttempt();
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Failure(ApplicationErrors.Auth.InvalidCode);
        }

        challenge.MarkUsed();
        return Result.Success();
    }

    private static string Hash(string key, Guid challengeId, string phone, string code)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var bytes = Encoding.UTF8.GetBytes($"{challengeId:N}:{phone}:{code}");
        return Convert.ToHexString(hmac.ComputeHash(bytes));
    }
}
