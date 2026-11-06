using System.Net.Http.Json;
using System.Text.Json;
using Huquqchi.Application;
using Huquqchi.Domain;

namespace Huquqchi.TelegramBot;

public sealed class TelegramOtpWorker(
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<TelegramOtpWorker> logger) : BackgroundService
{
    private readonly string _token = configuration["Telegram:BotToken"]!;
    private HttpClient? _client;
    private long _offset;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _client = new HttpClient
        {
            BaseAddress = new Uri($"https://api.telegram.org/bot{_token}/"),
            Timeout = TimeSpan.FromSeconds(40)
        };

        try
        {
            await EnsureBotIsAvailableAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            return;
        }
        catch
        {
            // The Telegram Bot API token is part of the request URL. Do not attach the
            // original HTTP exception to logs because it may disclose that credential.
            throw new InvalidOperationException(
                "Telegram bot ishga tusha olmadi. Bot tokeni va tarmoq ulanishini tekshiring.");
        }

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
                // HTTP exceptions can include a request URL containing the bot token.
                logger.LogError("Telegram update olishda xatolik. 5 soniyadan keyin qayta uriniladi.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    public override void Dispose()
    {
        _client?.Dispose();
        base.Dispose();
    }

    private async Task EnsureBotIsAvailableAsync(CancellationToken cancellationToken)
    {
        using var response = await _client!.GetAsync("getMe", cancellationToken);
        response.EnsureSuccessStatusCode();
        using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);
        if (!json.RootElement.GetProperty("ok").GetBoolean())
            throw new InvalidOperationException("Telegram bot token tasdiqlanmadi.");
    }

    private async Task PollAsync(CancellationToken cancellationToken)
    {
        var path = $"getUpdates?offset={_offset}&timeout=30&allowed_updates=%5B%22message%22%5D";
        using var response = await _client!.GetAsync(path, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);
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
            if (text is "/start" or "/help")
            {
                await SendContactRequestAsync(chatId, cancellationToken);
                return;
            }
        }

        if (!message.TryGetProperty("contact", out var contact))
        {
            await SendMessageAsync(chatId,
                "Tasdiqlash kodi olish uchun /start buyrug‘ini bosing va telefon raqamingizni yuboring.",
                cancellationToken);
            return;
        }

        if (!contact.TryGetProperty("user_id", out var contactUserId) || contactUserId.GetInt64() != senderId)
        {
            await SendMessageAsync(chatId,
                "Faqat o‘zingizning Telegram kontaktingizni yuborishingiz mumkin.", cancellationToken);
            return;
        }

        var phone = PhoneNumber.Normalize(contact.GetProperty("phone_number").GetString());
        if (phone is null)
        {
            await SendMessageAsync(chatId, "Telefon raqami formati noto‘g‘ri.", cancellationToken);
            return;
        }

        using var scope = scopeFactory.CreateScope();
        var otpService = scope.ServiceProvider.GetRequiredService<IOneTimeCodeService>();
        var result = await otpService.IssueAsync(phone, OtpDeliveryChannel.Telegram, senderId, cancellationToken);
        if (result.IsFailure)
        {
            await SendMessageAsync(chatId, result.Error.Message, cancellationToken);
            return;
        }

        await SendMessageAsync(chatId,
            $"Huquqchi tasdiqlash kodi: {result.Value.Code}\n\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang.",
            cancellationToken,
            removeKeyboard: true);
    }

    private Task SendContactRequestAsync(long chatId, CancellationToken cancellationToken) =>
        PostAsync("sendMessage", new
        {
            chat_id = chatId,
            text = "Huquqchi ilovasiga kirish kodini olish uchun telefon raqamingizni tasdiqlang.",
            reply_markup = new
            {
                keyboard = new[] { new[] { new { text = "📱 Telefon raqamimni yuborish", request_contact = true } } },
                resize_keyboard = true,
                one_time_keyboard = true
            }
        }, cancellationToken);

    private Task SendMessageAsync(long chatId, string text, CancellationToken cancellationToken,
        bool removeKeyboard = false) =>
        PostAsync("sendMessage", new
        {
            chat_id = chatId,
            text,
            reply_markup = removeKeyboard ? new { remove_keyboard = true } : null
        }, cancellationToken);

    private async Task PostAsync(string method, object payload, CancellationToken cancellationToken)
    {
        using var response = await _client!.PostAsJsonAsync(method, payload, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
