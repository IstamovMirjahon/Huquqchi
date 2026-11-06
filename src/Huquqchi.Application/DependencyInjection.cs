using Microsoft.Extensions.DependencyInjection;

namespace Huquqchi.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services) => services
        .AddScoped<IAuthService, AuthService>()
        .AddScoped<IProfileService, ProfileService>()
        .AddScoped<IDocumentService, DocumentService>()
        .AddScoped<IConversationService, ConversationService>()
        .AddScoped<ILegalCatalogService, LegalCatalogService>()
        .AddScoped<IDraftService, DraftService>();
}
