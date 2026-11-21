using Huquqchi.Application;

namespace Huquqchi.TelegramBot;

/// <summary>Drains the OTP outbox written by the API's request-code endpoint.</summary>
public sealed class OtpDeliveryWorker(IServiceScopeFactory scopeFactory, ILogger<OtpDeliveryWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan IdleDelay = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan ErrorDelay = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var processor = scope.ServiceProvider.GetRequiredService<IOtpDeliveryProcessor>();
                var handled = await processor.ProcessPendingAsync(stoppingToken);
                if (handled == 0) await Task.Delay(IdleDelay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // Exception type only: messages from HTTP calls may contain the bot token.
                logger.LogError("OTP navbatini qayta ishlashda xatolik ({ErrorType}). 5 soniyadan keyin qayta uriniladi.",
                    ex.GetType().Name);
                await Task.Delay(ErrorDelay, stoppingToken);
            }
        }
    }
}
