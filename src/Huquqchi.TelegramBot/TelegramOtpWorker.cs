using System.Text.Json;
using Huquqchi.Application;
using Huquqchi.Domain;

namespace Huquqchi.TelegramBot;

/// <summary>
/// Handles chat updates: links a Telegram account to a phone via a shared contact and issues a code on /start.
/// Codes requested from the app are pushed by <see cref="OtpDeliveryWorker"/> instead.
/// </summary>
public sealed class TelegramOtpWorker(
    TelegramBotApi api,
    IServiceScopeFactory scopeFactory,
    ILogger<TelegramOtpWorker> logger) : BackgroundService
{
    private long _offset;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        bool available;
        try
        {
            available = await api.IsAvailableAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            return;
        }
        catch
        {
            available = false;
        }

        // The Bot API token is part of the request URL. Do not attach the original HTTP
        // exception to logs because it may disclose that credential.
        if (!available)
            throw new InvalidOperationException(
                "Telegram bot ishga tusha olmadi. Bot tokeni va tarmoq ulanishini tekshiring.");

        logger.LogInformation("Huquqchi Telegram OTP bot ishga tushdi.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception)
            {
                logger.LogError("Telegram update olishda xatolik. 5 soniyadan keyin qayta uriniladi.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task PollAsync(CancellationToken cancellationToken)
    {
        using var json = await api.GetUpdatesAsync(_offset, cancellationToken);
        if (!json.RootElement.GetProperty("ok").GetBoolean()) return;

        foreach (var update in json.RootElement.GetProperty("result").EnumerateArray())
        {
            _offset = Math.Max(_offset, update.GetProperty("update_id").GetInt64() + 1);
            if (update.TryGetProperty("message", out var message))
                await HandleMessageAsync(message, cancellationToken);
        }
    }

    private async Task HandleMessageAsync(JsonElement message, CancellationToken cancellationToken)
    {
        var chatId = message.GetProperty("chat").GetProperty("id").GetInt64();
        var senderId = message.GetProperty("from").GetProperty("id").GetInt64();

        if (message.TryGetProperty("text", out var textElement))
        {
            var text = textElement.GetString()?.Trim();
            // "/start login" arrives from the t.me deep link returned by request-code.
            if (text is not null && (text == "/help" || text == "/start" || text.StartsWith("/start ", StringComparison.Ordinal)))
            {
                if (await TryIssueForLinkedAccountAsync(chatId, senderId, cancellationToken)) return;
                await SendContactRequestAsync(chatId, cancellationToken);
                return;
            }
        }

        if (!message.TryGetProperty("contact", out var contact))
        {
            await api.SendMessageAsync(chatId,
                "Tasdiqlash kodi olish uchun /start buyrug‘ini bosing va telefon raqamingizni yuboring.",
                cancellationToken);
            return;
        }

        if (!contact.TryGetProperty("user_id", out var contactUserId) || contactUserId.GetInt64() != senderId)
        {
            await api.SendMessageAsync(chatId,
                "Faqat o‘zingizning Telegram kontaktingizni yuborishingiz mumkin.", cancellationToken);
            return;
        }

        var phone = PhoneNumber.Normalize(contact.GetProperty("phone_number").GetString());
        if (phone is null)
        {
            await api.SendMessageAsync(chatId, "Telefon raqami formati noto‘g‘ri.", cancellationToken);
            return;
        }

        using var scope = scopeFactory.CreateScope();
        var accounts = scope.ServiceProvider.GetRequiredService<ITelegramAccountService>();
        var linked = await accounts.LinkAsync(senderId, phone, cancellationToken);
        if (linked.IsFailure)
        {
            await api.SendMessageAsync(chatId, linked.Error.Message, cancellationToken);
            return;
        }

        await IssueCodeAsync(scope, chatId, senderId, linked.Value, cancellationToken);
    }

    private async Task<bool> TryIssueForLinkedAccountAsync(long chatId, long senderId,
        CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var accounts = scope.ServiceProvider.GetRequiredService<ITelegramAccountService>();
        var phone = await accounts.GetPhoneAsync(senderId, cancellationToken);
        if (phone is null) return false;
        await IssueCodeAsync(scope, chatId, senderId, phone, cancellationToken);
        return true;
    }

    private async Task IssueCodeAsync(IServiceScope scope, long chatId, long senderId, string phone,
        CancellationToken cancellationToken)
    {
        var otpService = scope.ServiceProvider.GetRequiredService<IOneTimeCodeService>();
        var result = await otpService.IssueAsync(phone, OtpDeliveryChannel.Telegram, senderId, cancellationToken);
        if (result.IsFailure)
        {
            await api.SendMessageAsync(chatId, result.Error.Message, cancellationToken);
            return;
        }

        await api.SendMessageAsync(chatId, TelegramMessages.Code(result.Value.Code), cancellationToken,
            new { remove_keyboard = true });
    }

    private Task<string?> SendContactRequestAsync(long chatId, CancellationToken cancellationToken) =>
        api.SendMessageAsync(chatId,
            "Huquqchi ilovasiga kirish kodini olish uchun telefon raqamingizni tasdiqlang.",
            cancellationToken,
            new
            {
                keyboard = new[] { new[] { new { text = "📱 Telefon raqamimni yuborish", request_contact = true } } },
                resize_keyboard = true,
                one_time_keyboard = true
            });
}
