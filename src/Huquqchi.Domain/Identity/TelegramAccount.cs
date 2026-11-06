namespace Huquqchi.Domain;

public sealed class TelegramAccount : Entity
{
    private TelegramAccount() { }

    public TelegramAccount(long telegramUserId, string phone)
    {
        TelegramUserId = telegramUserId;
        Phone = phone;
    }

    public long TelegramUserId { get; private set; }
    public string Phone { get; private set; } = string.Empty;
}
