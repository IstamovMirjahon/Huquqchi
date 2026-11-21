using System.Security.Cryptography;
using System.Text;
using Huquqchi.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Huquqchi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string jwtIssuer,
        string jwtAudience,
        string jwtKey)
    {
        services.AddPersistence(configuration);
        var accessTokenMinutes = int.TryParse(configuration["Jwt:AccessTokenMinutes"], out var configuredMinutes)
            ? Math.Clamp(configuredMinutes, 5, 60)
            : 15;
        var refreshTokenDays = int.TryParse(configuration["Jwt:RefreshTokenDays"], out var configuredDays)
            ? Math.Clamp(configuredDays, 1, 90)
            : 30;
        services.AddSingleton<ITokenService>(new JwtTokenService(
            jwtIssuer, jwtAudience, jwtKey, TimeSpan.FromMinutes(accessTokenMinutes)));
        services.AddSingleton<IRefreshTokenFactory>(new RefreshTokenFactory(TimeSpan.FromDays(refreshTokenDays)));
        services.AddSingleton<IFileStorage>(new LocalFileStorage(
            Path.GetFullPath(configuration["Storage:Path"] ?? "storage")));
        services.AddFileServices(configuration, jwtKey);
        return services;
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IOneTimeCodeService, OneTimeCodeService>();
        services.AddScoped<IOtpDeliveryQueue, OtpDeliveryQueue>();
        return services;
    }

    private static void AddFileServices(this IServiceCollection services, IConfiguration configuration, string jwtKey)
    {
        // A dedicated key is preferred; otherwise derive one from the JWT key so the two never coincide.
        var signingKey = configuration["Files:SigningKey"];
        if (string.IsNullOrWhiteSpace(signingKey))
            signingKey = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(jwtKey), "huquqchi-file-urls"u8));
        var baseUrl = configuration["Files:PublicBaseUrl"] ?? "http://localhost:8080";
        var lifetimeMinutes = int.TryParse(configuration["Files:UrlLifetimeMinutes"], out var minutes)
            ? Math.Clamp(minutes, 1, 60)
            : 5;
        services.AddSingleton<IFileUrlSigner>(new HmacFileUrlSigner(baseUrl, signingKey, TimeSpan.FromMinutes(lifetimeMinutes)));

        var clamHost = configuration["ClamAv:Host"];
        if (string.IsNullOrWhiteSpace(clamHost))
        {
            services.AddSingleton<IMalwareScanner, NotConfiguredMalwareScanner>();
            return;
        }

        var clamPort = int.TryParse(configuration["ClamAv:Port"], out var port) ? port : 3310;
        services.AddSingleton<IMalwareScanner>(provider =>
            new ClamAvScanner(clamHost, clamPort, provider.GetRequiredService<ILogger<ClamAvScanner>>()));
    }
}
