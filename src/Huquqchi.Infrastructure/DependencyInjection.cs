using Huquqchi.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
        return services;
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IOneTimeCodeService, OneTimeCodeService>();
        return services;
    }
}
