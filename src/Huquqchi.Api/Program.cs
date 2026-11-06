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
const string nonProductionJwtKey = "local-test-host-only-signing-key-not-secret";
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer konfiguratsiyasi majburiy.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience konfiguratsiyasi majburiy.");
var jwtKey = builder.Configuration["Jwt:Key"] ?? nonProductionJwtKey;

builder.Services.AddControllers().AddJsonOptions(x => x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new OpenApiInfo { Title = "Huquqchi API", Version = "v1", Description = "O‘zbekiston huquqi bo‘yicha Huquqchi mobil ilovasi backend API" });
    x.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", Description = "Verify endpointidan olingan JWT token" });
    x.AddSecurityRequirement(_ => new OpenApiSecurityRequirement { { new OpenApiSecuritySchemeReference("Bearer", null), [] } });
});
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, jwtIssuer, jwtAudience, jwtKey);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(x =>
{
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});
builder.Services.AddAuthorization();
var healthChecks = builder.Services.AddHealthChecks();
if (!builder.Environment.IsEnvironment("Testing"))
    healthChecks.AddCheck<DatabaseHealthCheck>("postgres", failureStatus: HealthStatus.Unhealthy, tags: ["ready"]);

var app = builder.Build();
if (!app.Environment.IsEnvironment("Testing"))
{
    var configuredJwtKey = app.Configuration["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(configuredJwtKey) || configuredJwtKey.Length < 32)
        throw new InvalidOperationException("Jwt:Key kamida 32 belgidan iborat bo‘lishi kerak.");
    if (string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("Postgres")))
        throw new InvalidOperationException("ConnectionStrings:Postgres konfiguratsiyasi majburiy.");
    if (string.IsNullOrWhiteSpace(app.Configuration["Otp:Code"]))
        throw new InvalidOperationException("Otp:Code real SMS provayder ulanguncha majburiy.");
}
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
