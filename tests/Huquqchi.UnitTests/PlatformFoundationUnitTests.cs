using Huquqchi.Application;
using Huquqchi.Domain;

namespace Huquqchi.UnitTests;

public sealed class PlatformFoundationUnitTests
{
    [Theory]
    [InlineData(LawyerType.LegalConsultant, "legal_consultant")]
    [InlineData(FilePurpose.OrderMessage, "order_message")]
    [InlineData(UserRole.Client, "client")]
    public void Enum_codes_round_trip_as_snake_case<T>(T value, string code) where T : struct, Enum
    {
        Assert.Equal(code, value.ToCode());
        Assert.True(EnumCode.TryParse<T>(code, out var parsed));
        Assert.Equal(value, parsed);
    }

    [Fact]
    public void Unknown_enum_code_is_rejected() => Assert.False(EnumCode.TryParse<UserRole>("superuser", out _));

    [Theory]
    [InlineData("84.54.120.7", "84.54.•••.•••")]
    [InlineData("::ffff:10.1.2.3", "10.1.•••.•••")]
    [InlineData("garbage", null)]
    public void Ip_addresses_are_masked(string ip, string? expected) =>
        Assert.Equal(expected, ClientInfoFormatter.MaskIp(ip));

    [Fact]
    public void Device_label_names_browser_and_os() =>
        Assert.Equal("Edge · Windows", ClientInfoFormatter.DescribeDevice(
            "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0"));

    [Theory]
    [InlineData(".pdf", new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31 }, true)]
    [InlineData(".pdf", new byte[] { 0x4D, 0x5A, 0x90, 0x00 }, false)] // Windows executable renamed to .pdf
    [InlineData(".docx", new byte[] { 0x50, 0x4B, 0x03, 0x04 }, true)]
    [InlineData(".jpg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }, true)]
    public void File_signature_must_match_extension(string extension, byte[] header, bool expected) =>
        Assert.Equal(expected, FilePolicy.SignatureMatches(extension, header));

    [Fact]
    public void File_names_lose_directories_and_control_characters() =>
        Assert.Equal("passport.pdf", FilePolicy.SafeName("..\\..\\etc/pass\u0000port.pdf"));

    [Fact]
    public void Self_sign_up_cannot_create_staff_accounts() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new User("+998901234567", "Admin", UserRole.Admin));

    [Fact]
    public void Deleted_user_loses_personal_data_and_cannot_authenticate()
    {
        var user = new User("+998901234567", "Aziza", UserRole.Client);
        user.ChangeEmail("a@example.com");
        user.Delete(DateTimeOffset.UtcNow);

        Assert.False(user.CanAuthenticate);
        Assert.Equal(User.DeletedName, user.Name);
        Assert.Null(user.Email);
        Assert.DoesNotContain("998901234567", user.Phone);
    }

    [Fact]
    public void Notification_preferences_default_to_on_except_email_and_marketing()
    {
        var settings = new NotificationPreference(Guid.NewGuid());
        Assert.False(settings.ChannelSettings["email"]);
        Assert.False(settings.TypeSettings["marketing"]);
        Assert.True(settings.TypeSettings["order_message"]);

        settings.Update(new Dictionary<string, bool> { ["email"] = true }, new Dictionary<string, bool>());
        Assert.True(settings.ChannelSettings["email"]);
        Assert.True(settings.ChannelSettings["push"]);
    }

    [Fact]
    public void Page_request_is_clamped()
    {
        var page = new PageRequest(0, 500);
        Assert.Equal(1, page.Page);
        Assert.Equal(PageRequest.MaxPageSize, page.PageSize);
    }
}
