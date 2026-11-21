using System.Net.Http.Json;
using System.Text.Json;

namespace Huquqchi.TelegramBot;

/// <summary>
/// Minimal Telegram Bot API client shared by the update poller and the OTP outbox worker.
/// The token is part of every request URL, so HTTP exceptions are never logged as-is.
/// </summary>
public sealed class TelegramBotApi : IDisposable
{
    private readonly HttpClient _client;

    public TelegramBotApi(IConfiguration configuration)
    {
        var token = configuration["Telegram:BotToken"]
            ?? throw new InvalidOperationException("Telegram:BotToken konfiguratsiyasi majburiy.");
        _client = new HttpClient
        {
            BaseAddress = new Uri($"https://api.telegram.org/bot{token}/"),
            Timeout = TimeSpan.FromSeconds(40)
        };
    }

    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken)
    {
        using var response = await _client.GetAsync("getMe", cancellationToken);
        if (!response.IsSuccessStatusCode) return false;
        using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);
        return json.RootElement.GetProperty("ok").GetBoolean();
    }

    public async Task<JsonDocument> GetUpdatesAsync(long offset, CancellationToken cancellationToken)
    {
        var path = $"getUpdates?offset={offset}&timeout=30&allowed_updates=%5B%22message%22%5D";
        using var response = await _client.GetAsync(path, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);
    }

    /// <returns>Telegram's error description when the call fails (e.g. the user blocked the bot), otherwise null.</returns>
    public async Task<string?> SendMessageAsync(long chatId, string text, CancellationToken cancellationToken,
        object? replyMarkup = null)
    {
        using var response = await _client.PostAsJsonAsync("sendMessage", new
        {
            chat_id = chatId,
            text,
            reply_markup = replyMarkup
        }, cancellationToken);
        if (response.IsSuccessStatusCode) return null;
        try
        {
            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);
            return json.RootElement.TryGetProperty("description", out var description)
                ? description.GetString()
                : $"HTTP {(int)response.StatusCode}";
        }
        catch (JsonException)
        {
            return $"HTTP {(int)response.StatusCode}";
        }
    }

    public void Dispose() => _client.Dispose();
}
