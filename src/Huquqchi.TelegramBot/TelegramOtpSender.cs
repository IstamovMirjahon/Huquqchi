using Huquqchi.Application;
using Huquqchi.Domain;

namespace Huquqchi.TelegramBot;

/// <summary>Pushes a login code into the user's private chat with the bot (chat id = Telegram user id).</summary>
public sealed class TelegramOtpSender(TelegramBotApi api) : IOtpSender
{
    public OtpDeliveryChannel Channel => OtpDeliveryChannel.Telegram;

    public async Task<Result> SendAsync(OtpDeliveryRequest request, IssuedOneTimeCode code,
        CancellationToken cancellationToken)
    {
        if (request.ExternalUserId is not { } chatId)
            return Result.Failure(new Error("otp.recipient_missing", "Telegram foydalanuvchisi ko‘rsatilmagan.", ErrorType.Failure));

        var error = await api.SendMessageAsync(chatId, TelegramMessages.Code(code.Code), cancellationToken);
        return error is null
            ? Result.Success()
            : Result.Failure(new Error("otp.telegram_send_failed", error, ErrorType.Unavailable));
    }
}

public static class TelegramMessages
{
    public static string Code(string code) =>
        $"Huquqchi tasdiqlash kodi: {code}\n\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang.";
}
