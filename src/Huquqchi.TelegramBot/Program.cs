using Huquqchi.Application;
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

// The bot hosts only the services it uses; it never issues JWTs or serves files.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddScoped<ITelegramAccountService, TelegramAccountService>();
builder.Services.AddScoped<IOtpDeliveryProcessor, OtpDeliveryProcessor>();
builder.Services.AddSingleton<TelegramBotApi>();
builder.Services.AddSingleton<IOtpSender, TelegramOtpSender>();
builder.Services.AddHostedService<TelegramOtpWorker>();
builder.Services.AddHostedService<OtpDeliveryWorker>();

await builder.Build().RunAsync();
