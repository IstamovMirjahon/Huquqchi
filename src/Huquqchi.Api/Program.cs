using System.Text;
using System.Text.Json.Serialization;
using Huquqchi.Api;
using Huquqchi.Application;
using Huquqchi.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "huquqchi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "huquqchi-mobile";
var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-only-key-change-this-before-production-123456789";

builder.Services.AddControllers().AddJsonOptions(x => x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new OpenApiInfo { Title = "Huquqchi API", Version = "v1", Description = "O‘zbekiston huquqi bo‘yicha Huquqchi mobil ilovasi backend API" });
    x.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", Description = "Verify endpointidan olingan JWT token" });
    x.AddSecurityRequirement(_ => new OpenApiSecurityRequirement { { new OpenApiSecuritySchemeReference("Bearer", null), [] } });
});
builder.Services.AddDbContext<AppDbContext>(x => x.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddSingleton<ITokenService>(new JwtTokenService(jwtIssuer, jwtAudience, jwtKey));
builder.Services.AddSingleton<IFileStorage>(new LocalFileStorage(Path.GetFullPath(builder.Configuration["Storage:Path"] ?? "storage")));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DocumentService>();
builder.Services.AddScoped<ConversationService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<DraftService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(x =>
{
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = jwtIssuer,
        ValidateAudience = true, ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(30)
    };
});
builder.Services.AddAuthorization();
var healthChecks = builder.Services.AddHealthChecks();
if (!builder.Environment.IsEnvironment("Testing"))
    healthChecks.AddCheck<DatabaseHealthCheck>("postgres", failureStatus: HealthStatus.Unhealthy, tags: ["ready"]);

var app = builder.Build();
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(x => x.SwaggerEndpoint("/swagger/v1/swagger.json", "Huquqchi API v1"));
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Configuration.GetValue("Database:AutoMigrate", true))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(db);
}

app.Run();
public partial class Program { }
