using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Huquqchi.Api;
using Huquqchi.Application;
using Huquqchi.Domain;
using Huquqchi.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);
const string nonProductionJwtKey = "local-test-host-only-signing-key-not-secret";
const string CorsPolicy = "frontend";
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer konfiguratsiyasi majburiy.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience konfiguratsiyasi majburiy.");
var jwtKey = builder.Configuration["Jwt:Key"] ?? nonProductionJwtKey;

builder.Services.AddControllers()
    .AddJsonOptions(x =>
    {
        // Platform enums are snake_case on the wire (BACKEND_API.md §C); register them before the
        // catch-all converter, which keeps the legacy PascalCase enums the mobile app already uses.
        var snake = JsonNamingPolicy.SnakeCaseLower;
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter<UserRole>(snake));
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter<LawyerStatus>(snake));
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter<LawyerType>(snake));
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter<FilePurpose>(snake));
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(x => x.InvalidModelStateResponseFactory = context =>
    {
        var problem = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Bad Request",
            Detail = ApplicationErrors.Common.InvalidRequest.Message,
            Type = "https://httpstatuses.com/400"
        };
        problem.Extensions["code"] = ApplicationErrors.Common.InvalidRequest.Code;
        return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new OpenApiInfo { Title = "Huquqchi API", Version = "v1", Description = "Huquqchi huquqiy platformasi backend API (veb va mobil)" });
    x.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", Description = "Verify endpointidan olingan JWT token" });
    x.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", document), [] }
    });
    var xml = Path.Combine(AppContext.BaseDirectory, "Huquqchi.Api.xml");
    if (File.Exists(xml)) x.IncludeXmlComments(xml);
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, jwtIssuer, jwtAudience, jwtKey);
builder.Services.AddSingleton(new AuthSettings(
    builder.Configuration["Telegram:BotUrl"],
    builder.Configuration.GetValue("Sms:Enabled", false)));
builder.Services.AddSingleton(builder.Configuration.GetSection("Platform").Get<PlatformSettings>() ?? new PlatformSettings());

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
    x.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();
            await Problems.WriteAsync(context.HttpContext, new Error("auth.unauthorized",
                "Kirish talab qilinadi yoki token muddati tugagan.", ErrorType.Unauthorized));
        },
        OnForbidden = context => Problems.WriteAsync(context.HttpContext, ApplicationErrors.Auth.ForbiddenRole)
    };
});
builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["https://app.huquqchi.uz", "http://localhost:5173"];
builder.Services.AddCors(x => x.AddPolicy(CorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithExposedHeaders("Retry-After", "Location", "Content-Disposition")
    .SetPreflightMaxAge(TimeSpan.FromHours(1))));

// 120 requests per minute per user (per IP for anonymous calls), BACKEND_API.md §A.5.7.
var permitPerMinute = builder.Configuration.GetValue("RateLimiting:PermitPerMinute", 120);
builder.Services.AddRateLimiter(x =>
{
    x.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        if (context.Request.Path.StartsWithSegments("/health")) return RateLimitPartition.GetNoLimiter("health");
        var key = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub")
            ?? "ip:" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitPerMinute,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
    x.OnRejected = (context, _) =>
    {
        var retry = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var after) ? (int)Math.Ceiling(after.TotalSeconds) : 60;
        return new ValueTask(Problems.WriteAsync(context.HttpContext, ApplicationErrors.Common.RateLimited(retry)));
    };
});

// Behind a reverse proxy, trust X-Forwarded-For only when explicitly enabled, so clients cannot spoof their IP.
if (builder.Configuration.GetValue("ForwardedHeaders:Enabled", false))
{
    builder.Services.Configure<ForwardedHeadersOptions>(x =>
    {
        x.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        x.KnownIPNetworks.Clear();
        x.KnownProxies.Clear();
    });
}

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
    var otpHashKey = app.Configuration["Otp:HashKey"];
    if (string.IsNullOrWhiteSpace(otpHashKey) || otpHashKey.Length < 32)
        throw new InvalidOperationException("Otp:HashKey kamida 32 belgidan iborat bo‘lishi kerak.");
    var filesKey = app.Configuration["Files:SigningKey"];
    if (!string.IsNullOrEmpty(filesKey) && filesKey.Length < 32)
        throw new InvalidOperationException("Files:SigningKey kamida 32 belgidan iborat bo‘lishi kerak.");
}

if (app.Configuration.GetValue("ForwardedHeaders:Enabled", false)) app.UseForwardedHeaders();
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(x => x.SwaggerEndpoint("/swagger/v1/swagger.json", "Huquqchi API v1"));
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseRateLimiter();
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
