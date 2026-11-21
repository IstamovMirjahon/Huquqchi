using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Linq.Expressions;
using Huquqchi.Application;
using Huquqchi.Domain;
using Huquqchi.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Huquqchi.IntegrationTests;

public sealed class TestApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Database:AutoMigrate"] = "false",
            ["Otp:HashKey"] = "integration-test-otp-hash-key-not-secret",
            ["Jwt:Key"] = "integration-test-key-is-long-enough-123456789",
            ["Files:PublicBaseUrl"] = "http://localhost",
            ["RateLimiting:PermitPerMinute"] = "10000"
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IUnitOfWork>();
            services.RemoveAll<IFileStorage>();
            services.RemoveAll<IOneTimeCodeService>();
            services.AddSingleton<IUnitOfWork, TestUnitOfWork>();
            services.AddSingleton<IFileStorage, MemoryFileStorage>();
            services.AddSingleton<IOneTimeCodeService, TestOneTimeCodeService>();
        });
    }
}

public sealed class TestOneTimeCodeService : IOneTimeCodeService
{
    public Task<Result<IssuedOneTimeCode>> IssueAsync(string phone, OtpDeliveryChannel channel, long externalUserId,
        CancellationToken cancellationToken, bool enforceCooldown = true) =>
        Task.FromResult(Result.Success(new IssuedOneTimeCode("111111", DateTimeOffset.UtcNow.AddMinutes(5))));

    public Task<Result> VerifyAsync(string phone, string code, CancellationToken cancellationToken) =>
        Task.FromResult(code == "111111"
            ? Result.Success()
            : Result.Failure(ApplicationErrors.Auth.InvalidCode));
}

public sealed class OtpServiceTests
{
    [Fact]
    public async Task Code_is_phone_bound_rate_limited_and_single_use()
    {
        var unitOfWork = new TestUnitOfWork();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Otp:HashKey"] = "integration-test-otp-hash-key-not-secret"
        }).Build();
        var service = new OneTimeCodeService(unitOfWork, configuration);

        var issued = await service.IssueAsync("90 123 45 67", OtpDeliveryChannel.Telegram, 123, default);
        Assert.True(issued.IsSuccess);
        Assert.Equal(6, issued.Value.Code.Length);

        var repeated = await service.IssueAsync("+998901234567", OtpDeliveryChannel.Telegram, 123, default);
        Assert.True(repeated.IsFailure);
        Assert.Equal("auth.code_rate_limited", repeated.Error.Code);

        var wrongCode = issued.Value.Code == "000000" ? "999999" : "000000";
        Assert.True((await service.VerifyAsync("+998901234567", wrongCode, default)).IsFailure);
        Assert.True((await service.VerifyAsync("+998901234567", issued.Value.Code, default)).IsSuccess);
        Assert.True((await service.VerifyAsync("+998901234567", issued.Value.Code, default)).IsFailure);
    }
}

public sealed class TelegramAccountServiceTests
{
    [Fact]
    public async Task Contact_is_linked_once_and_reused_for_later_codes()
    {
        var service = new TelegramAccountService(new TestUnitOfWork());

        var first = await service.LinkAsync(1001, "+998901234567", default);
        var repeated = await service.LinkAsync(1001, "+998909999999", default);
        var otherAccount = await service.LinkAsync(2002, "+998901234567", default);

        Assert.True(first.IsSuccess);
        Assert.Equal("+998901234567", repeated.Value);
        Assert.Equal("+998901234567", await service.GetPhoneAsync(1001, default));
        Assert.True(otherAccount.IsFailure);
        Assert.Equal("auth.phone_already_linked", otherAccount.Error.Code);
    }
}

public sealed class ApiTests(TestApiFactory factory) : IClassFixture<TestApiFactory>
{
    [Fact]
    public async Task Swagger_and_health_are_available()
    {
        var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        var swaggerResponse = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, swaggerResponse.StatusCode);
        using var swagger = JsonDocument.Parse(await swaggerResponse.Content.ReadAsStringAsync());
        var security = swagger.RootElement.GetProperty("security");
        Assert.True(security.GetArrayLength() > 0);
        Assert.True(security[0].TryGetProperty("Bearer", out _));
    }

    [Fact]
    public async Task Auth_profile_and_document_flow_works()
    {
        var client = factory.CreateClient();
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify", new { phone = "+998901234567", code = "111111", name = "Ali", workspaceKind = "Personal", acceptTerms = true });
        verify.EnsureSuccessStatusCode();
        var auth = await verify.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Options);
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var profile = await client.GetAsync("/api/v1/profile");
        profile.EnsureSuccessStatusCode();

        Assert.False(string.IsNullOrWhiteSpace(auth.RefreshToken));
        var refreshResponse = await client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = auth.RefreshToken });
        refreshResponse.EnsureSuccessStatusCode();
        var refreshed = await refreshResponse.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Options);
        Assert.NotNull(refreshed);
        Assert.NotEqual(auth.RefreshToken, refreshed.RefreshToken);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", refreshed.AccessToken);
        (await client.GetAsync("/api/v1/profile")).EnsureSuccessStatusCode();

        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent("test pdf content"u8.ToArray()) { Headers = { ContentType = new MediaTypeHeaderValue("application/pdf") } }, "file", "contract.pdf");
        form.Add(new StringContent("Uploaded"), "origin");
        var uploaded = await client.PostAsync("/api/v1/documents", form);
        Assert.Equal(HttpStatusCode.Created, uploaded.StatusCode);
        using var uploadedJson = JsonDocument.Parse(await uploaded.Content.ReadAsStringAsync());
        var documentId = uploadedJson.RootElement.GetProperty("id").GetGuid();

        using var duplicateForm = new MultipartFormDataContent();
        duplicateForm.Add(new ByteArrayContent("test pdf content"u8.ToArray())
        { Headers = { ContentType = new MediaTypeHeaderValue("application/pdf") } }, "file", "duplicate.pdf");
        duplicateForm.Add(new StringContent("Uploaded"), "origin");
        var duplicate = await client.PostAsync("/api/v1/documents", duplicateForm);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        using var duplicateProblem = JsonDocument.Parse(await duplicate.Content.ReadAsStringAsync());
        Assert.Equal("documents.duplicate", duplicateProblem.RootElement.GetProperty("code").GetString());

        var documentsResponse = await client.GetAsync("/api/v1/documents");
        documentsResponse.EnsureSuccessStatusCode();
        using var documents = JsonDocument.Parse(await documentsResponse.Content.ReadAsStringAsync());
        Assert.Equal(1, documents.RootElement.GetArrayLength());

        var secondVerify = await client.PostAsJsonAsync("/api/v1/auth/verify", new
        { phone = "+998909999999", code = "111111", name = "Vali", workspaceKind = "Personal", acceptTerms = true });
        secondVerify.EnsureSuccessStatusCode();
        var secondAuth = await secondVerify.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Options);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secondAuth!.AccessToken);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/v1/documents/{documentId}")).StatusCode);

        var logout = await client.PostAsJsonAsync("/api/v1/auth/logout",
            new { refreshToken = refreshed.RefreshToken });
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = refreshed.RefreshToken })).StatusCode);
    }
}

public static class TestJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };
}

public sealed class MemoryFileStorage : IFileStorage
{
    private readonly Dictionary<string, byte[]> _files = [];
    public async Task<(string Key, string Sha256)> SaveAsync(Stream stream, string extension, CancellationToken ct)
    {
        using var ms = new MemoryStream(); await stream.CopyToAsync(ms, ct); var data = ms.ToArray(); var key = Guid.NewGuid() + extension; _files[key] = data;
        return (key, Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(data)).ToLowerInvariant());
    }
    public Task<Stream> OpenReadAsync(string key, CancellationToken ct) => Task.FromResult<Stream>(new MemoryStream(_files[key]));
    public Task DeleteAsync(string key, CancellationToken ct) { _files.Remove(key); return Task.CompletedTask; }
}

public sealed class TestUnitOfWork : IUnitOfWork
{
    private readonly Dictionary<Type, object> _sets = new();
    internal List<T> Set<T>() where T : Entity
    {
        if (!_sets.TryGetValue(typeof(T), out var set)) _sets[typeof(T)] = set = new List<T>();
        return (List<T>)set;
    }
    public IRepository<T> Repository<T>() where T : Entity => new TestRepository<T>(this);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
}

public sealed class TestRepository<T>(TestUnitOfWork unitOfWork) : IRepository<T> where T : Entity
{
    private List<T> Set => unitOfWork.Set<T>();
    public Task<T?> GetByIdAsync(Guid id, bool asTracking = false, CancellationToken cancellationToken = default) =>
        Task.FromResult(Set.FirstOrDefault(x => x.Id == id));
    public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asTracking = false, CancellationToken cancellationToken = default) =>
        Task.FromResult(Set.AsQueryable().FirstOrDefault(predicate));
    public Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null, bool asTracking = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<T> query = Set.AsQueryable();
        if (predicate is not null) query = query.Where(predicate);
        if (orderBy is not null) query = orderBy(query);
        return Task.FromResult<IReadOnlyList<T>>(query.ToList());
    }
    public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
        Task.FromResult(Set.AsQueryable().Any(predicate));
    public Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
        Task.FromResult(Set.AsQueryable().Count(predicate));
    public Task AddAsync(T entity, CancellationToken cancellationToken = default) { Set.Add(entity); return Task.CompletedTask; }
    public void Remove(T entity) => Set.Remove(entity);
}
