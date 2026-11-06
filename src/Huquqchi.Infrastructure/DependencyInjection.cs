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
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<ITokenService>(new JwtTokenService(jwtIssuer, jwtAudience, jwtKey));
        services.AddSingleton<IFileStorage>(new LocalFileStorage(
            Path.GetFullPath(configuration["Storage:Path"] ?? "storage")));
        return services;
    }
}
