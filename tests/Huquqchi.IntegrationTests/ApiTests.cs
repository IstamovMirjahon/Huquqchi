using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
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
            ["Otp:Code"] = "111111",
            ["Jwt:Key"] = "integration-test-key-is-long-enough-123456789"
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IAppDbContext>();
            services.RemoveAll<IFileStorage>();
            services.AddSingleton<IAppDbContext, TestAppDbContext>();
            services.AddSingleton<IFileStorage, MemoryFileStorage>();
        });
    }
}

public sealed class ApiTests(TestApiFactory factory) : IClassFixture<TestApiFactory>
{
    [Fact]
    public async Task Swagger_and_health_are_available()
    {
        var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/swagger/v1/swagger.json")).StatusCode);
    }

    [Fact]
    public async Task Auth_profile_and_document_flow_works()
    {
        var client = factory.CreateClient();
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify", new { phone = "+998901234567", code = "111111", name = "Ali", workspaceKind = "Personal" });
        verify.EnsureSuccessStatusCode();
        var auth = await verify.Content.ReadFromJsonAsync<AuthResult>();
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var profile = await client.GetAsync("/api/v1/profile");
        profile.EnsureSuccessStatusCode();

        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent("test pdf content"u8.ToArray()) { Headers = { ContentType = new MediaTypeHeaderValue("application/pdf") } }, "file", "contract.pdf");
        form.Add(new StringContent("Uploaded"), "origin");
        var uploaded = await client.PostAsync("/api/v1/documents", form);
        Assert.Equal(HttpStatusCode.Created, uploaded.StatusCode);
        var documentsResponse = await client.GetAsync("/api/v1/documents");
        documentsResponse.EnsureSuccessStatusCode();
        using var documents = JsonDocument.Parse(await documentsResponse.Content.ReadAsStringAsync());
        Assert.Equal(1, documents.RootElement.GetArrayLength());
    }
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

public sealed class TestAppDbContext : IAppDbContext
{
    private readonly Dictionary<Type, object> _sets = new();
    private List<T> Set<T>() where T : class
    {
        if (!_sets.TryGetValue(typeof(T), out var set)) _sets[typeof(T)] = set = new List<T>();
        return (List<T>)set;
    }
    public IQueryable<User> Users => Set<User>().AsQueryable();
    public IQueryable<Workspace> Workspaces => Set<Workspace>().AsQueryable();
    public IQueryable<Membership> Memberships => Set<Membership>().AsQueryable();
    public IQueryable<Conversation> Conversations => Set<Conversation>().AsQueryable();
    public IQueryable<Message> Messages => Set<Message>().AsQueryable();
    public IQueryable<Citation> Citations => Set<Citation>().AsQueryable();
    public IQueryable<UploadedDocument> UploadedDocuments => Set<UploadedDocument>().AsQueryable();
    public IQueryable<DocumentVersion> DocumentVersions => Set<DocumentVersion>().AsQueryable();
    public IQueryable<ConversationDocument> ConversationDocuments => Set<ConversationDocument>().AsQueryable();
    public IQueryable<Analysis> Analyses => Set<Analysis>().AsQueryable();
    public IQueryable<Finding> Findings => Set<Finding>().AsQueryable();
    public IQueryable<LegalDocument> LegalDocuments => Set<LegalDocument>().AsQueryable();
    public IQueryable<LegalVersion> LegalVersions => Set<LegalVersion>().AsQueryable();
    public IQueryable<LegalSection> LegalSections => Set<LegalSection>().AsQueryable();
    public IQueryable<Template> Templates => Set<Template>().AsQueryable();
    public IQueryable<Draft> Drafts => Set<Draft>().AsQueryable();
    public void Add<T>(T entity) where T : class => Set<T>().Add(entity);
    public void Remove<T>(T entity) where T : class => Set<T>().Remove(entity);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
}
