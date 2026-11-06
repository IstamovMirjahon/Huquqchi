using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class TelegramAccountService(IUnitOfWork unitOfWork) : ITelegramAccountService
{
    public async Task<string?> GetPhoneAsync(long telegramUserId, CancellationToken cancellationToken)
    {
        var account = await unitOfWork.Repository<TelegramAccount>()
            .FirstOrDefaultAsync(x => x.TelegramUserId == telegramUserId, cancellationToken: cancellationToken);
        return account?.Phone;
    }

    public async Task<Result<string>> LinkAsync(long telegramUserId, string phone,
        CancellationToken cancellationToken)
    {
        var normalizedPhone = PhoneNumber.Normalize(phone);
        if (normalizedPhone is null) return Result.Failure<string>(ApplicationErrors.Auth.InvalidPhone);

        var repository = unitOfWork.Repository<TelegramAccount>();
        var existingTelegram = await repository.FirstOrDefaultAsync(
            x => x.TelegramUserId == telegramUserId, cancellationToken: cancellationToken);
        if (existingTelegram is not null) return Result.Success(existingTelegram.Phone);

        if (await repository.AnyAsync(x => x.Phone == normalizedPhone, cancellationToken))
            return Result.Failure<string>(ApplicationErrors.Auth.PhoneAlreadyLinked);

        await repository.AddAsync(new TelegramAccount(telegramUserId, normalizedPhone), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(normalizedPhone);
    }
}
