using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace Huquqchi.IntegrationTests;

/// <summary>Phase 1 contract (BACKEND_API.md §1, §2, §3, §17): auth, me, files and reference data.</summary>
public sealed class PlatformFoundationTests(TestApiFactory factory) : IClassFixture<TestApiFactory>
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4];
    private static int _phoneSeed = 1_000_000;

    private TestUnitOfWork Store => (TestUnitOfWork)factory.Services.GetRequiredService<IUnitOfWork>();

    // ---------- Auth ----------

    [Fact]
    public async Task Request_code_for_unlinked_phone_points_to_the_bot()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone = NewPhone() });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        using var json = await ReadJson(response);
        Assert.Equal("telegram", json.RootElement.GetProperty("deliveryChannel").GetString());
        Assert.False(json.RootElement.GetProperty("codeSent").GetBoolean());
        Assert.True(json.RootElement.GetProperty("isNewUser").GetBoolean());
        Assert.Equal(60, json.RootElement.GetProperty("resendAfterSeconds").GetInt32());
    }

    [Fact]
    public async Task Request_code_for_linked_phone_queues_telegram_push_and_enforces_cooldown()
    {
        var phone = NewPhone();
        Store.Set<TelegramAccount>().Add(new TelegramAccount(777_001, phone));
        var client = factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone, channel = "telegram" });
        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        using (var json = await ReadJson(first)) Assert.True(json.RootElement.GetProperty("codeSent").GetBoolean());

        var queued = Assert.Single(Store.Set<OtpDeliveryRequest>(), x => x.Phone == phone);
        Assert.Equal(OtpDeliveryChannel.Telegram, queued.Channel);
        Assert.Equal(777_001, queued.ExternalUserId);
        Assert.Equal(OtpDeliveryStatus.Pending, queued.Status);

        var second = await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone });
        await AssertProblem(second, HttpStatusCode.TooManyRequests, "auth.code_rate_limited");
        Assert.NotNull(second.Headers.RetryAfter);
    }

    [Fact]
    public async Task Request_code_validates_phone_and_channel()
    {
        var client = factory.CreateClient();
        await AssertProblem(await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone = "123" }),
            HttpStatusCode.BadRequest, "auth.invalid_phone");
        await AssertProblem(await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone = NewPhone(), channel = "sms" }),
            HttpStatusCode.ServiceUnavailable, "auth.channel_unavailable");
        await AssertProblem(await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone = NewPhone(), channel = "fax" }),
            HttpStatusCode.BadRequest, "common.invalid_request");
    }

    [Fact]
    public async Task Sign_up_requires_name_terms_and_a_self_service_role()
    {
        var client = factory.CreateClient();
        var phone = NewPhone();
        await AssertProblem(await Verify(client, phone, name: null), HttpStatusCode.BadRequest, "auth.name_required");
        await AssertProblem(await Verify(client, phone, acceptTerms: false), HttpStatusCode.BadRequest, "auth.terms_required");
        await AssertProblem(await Verify(client, phone, role: "admin"), HttpStatusCode.BadRequest, "auth.invalid_role");
        Assert.Equal(HttpStatusCode.OK, (await Verify(client, phone)).StatusCode);
    }

    [Fact]
    public async Task Lawyer_sign_up_creates_draft_profile_and_returns_me_in_one_call()
    {
        var client = factory.CreateClient();
        var response = await Verify(client, NewPhone(), role: "lawyer");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJson(response);
        var root = json.RootElement;
        Assert.Equal("lawyer", root.GetProperty("role").GetString());
        var user = root.GetProperty("user");
        Assert.Equal("lawyer", user.GetProperty("role").GetString());
        Assert.Equal("draft", user.GetProperty("lawyerStatus").GetString());
        Assert.NotEqual(JsonValueKind.Null, user.GetProperty("lawyerProfileId").ValueKind);
        Assert.Equal("lawyer_free", user.GetProperty("subscription").GetProperty("planCode").GetString());
        Assert.True(root.TryGetProperty("refreshTokenExpiresAt", out _));
    }

    [Fact]
    public async Task Sessions_are_listed_per_device_and_logout_all_keeps_only_the_current_one()
    {
        var phone = NewPhone();
        var laptop = factory.CreateClient();
        laptop.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36");
        using var first = await ReadJson(await Verify(laptop, phone));
        var laptopRefresh = first.RootElement.GetProperty("refreshToken").GetString();

        var phoneClient = factory.CreateClient();
        phoneClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36");
        using var second = await ReadJson(await Verify(phoneClient, phone));
        Authorize(phoneClient, second);
        var phoneRefresh = second.RootElement.GetProperty("refreshToken").GetString();

        using (var sessions = await ReadJson(await phoneClient.GetAsync("/api/v1/auth/sessions")))
        {
            var items = sessions.RootElement.EnumerateArray().ToList();
            Assert.Equal(2, items.Count);
            var current = Assert.Single(items, x => x.GetProperty("isCurrent").GetBoolean());
            Assert.Equal("Chrome · Android", current.GetProperty("device").GetString());
            Assert.Contains(items, x => x.GetProperty("device").GetString() == "Chrome · Windows");
        }

        Assert.Equal(HttpStatusCode.NoContent, (await phoneClient.PostAsync("/api/v1/auth/logout-all", null)).StatusCode);
        await AssertProblem(await laptop.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = laptopRefresh }),
            HttpStatusCode.Unauthorized, "auth.invalid_refresh_token");
        Assert.Equal(HttpStatusCode.OK,
            (await phoneClient.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = phoneRefresh })).StatusCode);

        await AssertProblem(await phoneClient.DeleteAsync($"/api/v1/auth/sessions/{Guid.NewGuid()}"),
            HttpStatusCode.NotFound, "auth.session_not_found");
    }

    [Fact]
    public async Task Protected_endpoints_return_problem_details_without_a_token()
    {
        var response = await factory.CreateClient().GetAsync("/api/v1/me");
        await AssertProblem(response, HttpStatusCode.Unauthorized, "auth.unauthorized");
    }

    // ---------- Me ----------

    [Fact]
    public async Task Me_returns_profile_plan_and_usage_and_can_be_updated()
    {
        var client = await SignedInClientAsync();
        using (var me = await ReadJson(await client.GetAsync("/api/v1/me")))
        {
            var root = me.RootElement;
            Assert.Equal("client", root.GetProperty("role").GetString());
            Assert.Equal(JsonValueKind.Null, root.GetProperty("lawyerStatus").ValueKind);
            Assert.Equal("client_free", root.GetProperty("subscription").GetProperty("planCode").GetString());
            var aiQuestions = Assert.Single(root.GetProperty("usage").EnumerateArray(),
                x => x.GetProperty("metric").GetString() == "ai_questions");
            Assert.Equal(5, aiQuestions.GetProperty("limit").GetInt32());
            Assert.Equal("day", aiQuestions.GetProperty("period").GetString());
            Assert.EndsWith("+05:00", aiQuestions.GetProperty("resetsAt").GetString());
        }

        var updated = await client.PatchAsJsonAsync("/api/v1/me", new { email = "Aziza@Example.com", language = "ru" });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        using (var json = await ReadJson(updated))
        {
            Assert.Equal("aziza@example.com", json.RootElement.GetProperty("email").GetString());
            Assert.Equal("ru", json.RootElement.GetProperty("language").GetString());
        }

        await AssertProblem(await client.PatchAsJsonAsync("/api/v1/me", new { language = "en" }),
            HttpStatusCode.BadRequest, "me.invalid_language");
        await AssertProblem(await client.PatchAsJsonAsync("/api/v1/me", new { email = "not-an-email" }),
            HttpStatusCode.BadRequest, "me.invalid_email");
    }

    [Fact]
    public async Task Notification_settings_have_defaults_and_reject_unknown_keys()
    {
        var client = await SignedInClientAsync();
        using (var defaults = await ReadJson(await client.GetAsync("/api/v1/me/notification-settings")))
        {
            Assert.False(defaults.RootElement.GetProperty("channels").GetProperty("email").GetBoolean());
            Assert.True(defaults.RootElement.GetProperty("channels").GetProperty("telegram").GetBoolean());
            Assert.False(defaults.RootElement.GetProperty("types").GetProperty("marketing").GetBoolean());
        }

        var put = await client.PutAsJsonAsync("/api/v1/me/notification-settings",
            new { channels = new { email = true }, types = new { order_message = false } });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        using (var saved = await ReadJson(await client.GetAsync("/api/v1/me/notification-settings")))
        {
            Assert.True(saved.RootElement.GetProperty("channels").GetProperty("email").GetBoolean());
            Assert.False(saved.RootElement.GetProperty("types").GetProperty("order_message").GetBoolean());
            Assert.True(saved.RootElement.GetProperty("types").GetProperty("analysis_ready").GetBoolean());
        }

        await AssertProblem(await client.PutAsJsonAsync("/api/v1/me/notification-settings",
            new { channels = new { fax = true } }), HttpStatusCode.BadRequest, "me.invalid_notification_setting");
    }

    [Fact]
    public async Task Export_is_accepted_and_account_deletion_requires_confirmation()
    {
        var phone = NewPhone();
        var client = factory.CreateClient();
        using var auth = await ReadJson(await Verify(client, phone));
        Authorize(client, auth);
        var refresh = auth.RootElement.GetProperty("refreshToken").GetString();

        var export = await client.PostAsync("/api/v1/me/export", null);
        Assert.Equal(HttpStatusCode.Accepted, export.StatusCode);
        using (var json = await ReadJson(export)) Assert.True(json.RootElement.TryGetProperty("requestId", out _));

        await AssertProblem(await SendDelete(client, new { confirm = "ha" }), HttpStatusCode.BadRequest, "me.confirmation_required");
        Assert.Equal(HttpStatusCode.NoContent, (await SendDelete(client, new { confirm = "O'CHIRISH", reason = "test" })).StatusCode);

        await AssertProblem(await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = refresh }),
            HttpStatusCode.Unauthorized, "auth.invalid_refresh_token");
        Assert.DoesNotContain(Store.Set<User>(), x => x.Phone == phone);

        // The phone number is free again and signs up as a brand-new account.
        using var again = await ReadJson(await client.PostAsJsonAsync("/api/v1/auth/request-code", new { phone }));
        Assert.True(again.RootElement.GetProperty("isNewUser").GetBoolean());
    }

    // ---------- Files ----------

    [Fact]
    public async Task File_upload_returns_signed_url_that_serves_the_content_only_while_valid()
    {
        var client = await SignedInClientAsync();
        var upload = await client.PostAsync("/api/v1/files", Multipart(Png, "dalil.png", "order_message"));
        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
        Assert.NotNull(upload.Headers.Location);

        using var json = await ReadJson(upload);
        var file = json.RootElement;
        Assert.Equal("image/png", file.GetProperty("mime").GetString());
        Assert.Equal(Png.Length, file.GetProperty("size").GetInt32());
        var url = new Uri(file.GetProperty("url").GetString()!);

        var anonymous = factory.CreateClient();
        var content = await anonymous.GetAsync(url.PathAndQuery);
        Assert.Equal(HttpStatusCode.OK, content.StatusCode);
        Assert.Equal(Png, await content.Content.ReadAsByteArrayAsync());
        Assert.Equal("nosniff", content.Headers.GetValues("X-Content-Type-Options").Single());

        var tampered = url.PathAndQuery[..^1] + (url.PathAndQuery[^1] == '0' ? '1' : '0');
        await AssertProblem(await anonymous.GetAsync(tampered), HttpStatusCode.NotFound, "files.not_found");

        var id = file.GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/v1/files/{id}")).StatusCode);
        var stranger = await SignedInClientAsync();
        await AssertProblem(await stranger.GetAsync($"/api/v1/files/{id}"), HttpStatusCode.NotFound, "files.not_found");
    }

    [Fact]
    public async Task File_upload_enforces_purpose_type_signature_and_size()
    {
        var client = await SignedInClientAsync();
        await AssertProblem(await client.PostAsync("/api/v1/files", Multipart(Png, "a.png", "selfie")),
            HttpStatusCode.BadRequest, "files.invalid_purpose");
        await AssertProblem(await client.PostAsync("/api/v1/files", Multipart(Png, "a.exe", "order_message")),
            HttpStatusCode.UnsupportedMediaType, "files.invalid_type");
        await AssertProblem(await client.PostAsync("/api/v1/files", Multipart("not an image"u8.ToArray(), "a.png", "order_message")),
            HttpStatusCode.UnsupportedMediaType, "files.invalid_type");
        await AssertProblem(await client.PostAsync("/api/v1/files", Multipart(Png, "a.zip", "kyc")),
            HttpStatusCode.UnsupportedMediaType, "files.invalid_type");

        var largePdf = new byte[10 * 1024 * 1024 + 1];
        "%PDF-"u8.CopyTo(largePdf);
        await AssertProblem(await client.PostAsync("/api/v1/files", Multipart(largePdf, "pasport.pdf", "kyc")),
            HttpStatusCode.RequestEntityTooLarge, "files.too_large");
    }

    [Fact]
    public async Task Avatar_upload_sets_avatar_url_on_me()
    {
        var client = await SignedInClientAsync();
        var response = await client.PostAsync("/api/v1/me/avatar", Multipart(Png, "me.png", null));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var me = await ReadJson(await client.GetAsync("/api/v1/me"));
        Assert.Contains("/api/v1/files/", me.RootElement.GetProperty("avatarUrl").GetString());
    }

    // ---------- Reference ----------

    [Fact]
    public async Task Reference_data_is_public_and_cacheable()
    {
        var client = factory.CreateClient();
        var categories = await client.GetAsync("/api/v1/reference/categories");
        Assert.Equal(HttpStatusCode.OK, categories.StatusCode);
        Assert.Equal(TimeSpan.FromHours(1), categories.Headers.CacheControl?.MaxAge);
        using (var json = await ReadJson(categories))
        {
            Assert.Equal(13, json.RootElement.GetArrayLength());
            Assert.Equal("labor", json.RootElement[0].GetProperty("code").GetString());
        }

        using (var regions = await ReadJson(await client.GetAsync("/api/v1/reference/regions")))
            Assert.Equal(14, regions.RootElement.GetArrayLength());

        using var config = await ReadJson(await client.GetAsync("/api/v1/reference/config"));
        Assert.Equal(25, config.RootElement.GetProperty("uploadMaxMb").GetInt32());
        Assert.Equal(30, config.RootElement.GetProperty("orderTimeouts").GetProperty("paymentMinutes").GetInt32());
    }

    // ---------- helpers ----------

    private static string NewPhone() => $"+99890{Interlocked.Increment(ref _phoneSeed):D7}";

    private static Task<HttpResponseMessage> Verify(HttpClient client, string phone, string? name = "Aziza Karimova",
        bool acceptTerms = true, string? role = null) =>
        client.PostAsJsonAsync("/api/v1/auth/verify",
            new { phone, code = "111111", name, role, acceptTerms, workspaceKind = "Personal" });

    private async Task<HttpClient> SignedInClientAsync()
    {
        var client = factory.CreateClient();
        var response = await Verify(client, NewPhone());
        response.EnsureSuccessStatusCode();
        using var json = await ReadJson(response);
        Authorize(client, json);
        return client;
    }

    private static void Authorize(HttpClient client, JsonDocument auth) =>
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.RootElement.GetProperty("accessToken").GetString());

    private static Task<HttpResponseMessage> SendDelete(HttpClient client, object body) =>
        client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/me") { Content = JsonContent.Create(body) });

    private static MultipartFormDataContent Multipart(byte[] bytes, string fileName, string? purpose)
    {
        var form = new MultipartFormDataContent { { new ByteArrayContent(bytes), "file", fileName } };
        if (purpose is not null) form.Add(new StringContent(purpose), "purpose");
        return form;
    }

    private static async Task<JsonDocument> ReadJson(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync());

    private static async Task AssertProblem(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(status == response.StatusCode, $"Expected {(int)status}, got {(int)response.StatusCode}: {body}");
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var json = JsonDocument.Parse(body);
        Assert.Equal(code, json.RootElement.GetProperty("code").GetString());
        Assert.Equal((int)status, json.RootElement.GetProperty("status").GetInt32());
    }
}
