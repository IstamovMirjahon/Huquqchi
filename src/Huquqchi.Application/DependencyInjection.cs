using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Huquqchi.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);
        return services
            .AddScoped<IAuthService, AuthService>()
            .AddScoped<IOtpDeliveryProcessor, OtpDeliveryProcessor>()
            .AddScoped<ITelegramAccountService, TelegramAccountService>()
            .AddScoped<IMeService, MeService>()
            .AddScoped<IUsageService, UsageService>()
            .AddScoped<IFileService, FileService>()
            .AddScoped<IReferenceService, ReferenceService>()
            .AddScoped<IProfileService, ProfileService>()
            .AddScoped<IDocumentService, DocumentService>()
            .AddScoped<IConversationService, ConversationService>()
            .AddScoped<ILegalCatalogService, LegalCatalogService>()
            .AddScoped<IDraftService, DraftService>();
    }
}
