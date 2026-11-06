using Huquqchi.Infrastructure;
using Huquqchi.TelegramBot;

var builder = Host.CreateApplicationBuilder(args);

if (string.IsNullOrWhiteSpace(builder.Configuration["Telegram:BotToken"]))
    throw new InvalidOperationException("Telegram:BotToken konfiguratsiyasi majburiy.");
if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("Postgres")))
    throw new InvalidOperationException("ConnectionStrings:Postgres konfiguratsiyasi majburiy.");
var otpHashKey = builder.Configuration["Otp:HashKey"];
if (string.IsNullOrWhiteSpace(otpHashKey) || otpHashKey.Length < 32)
    throw new InvalidOperationException("Otp:HashKey kamida 32 belgidan iborat bo‘lishi kerak.");

builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddHostedService<TelegramOtpWorker>();

await builder.Build().RunAsync();
