namespace Huquqchi.Application;

public interface ITelegramAccountService
{
    Task<string?> GetPhoneAsync(long telegramUserId, CancellationToken cancellationToken);
    Task<Result<string>> LinkAsync(long telegramUserId, string phone, CancellationToken cancellationToken);
}
