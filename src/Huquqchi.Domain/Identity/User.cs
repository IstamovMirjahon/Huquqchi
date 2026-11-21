namespace Huquqchi.Domain;

public sealed class User : Entity
{
    public const string DeletedName = "O‘chirilgan foydalanuvchi";

    private User() { }

    public User(string phone, string name, UserRole role = UserRole.Client, string language = "uz-Latn")
    {
        if (role is not (UserRole.Client or UserRole.Lawyer))
            throw new ArgumentOutOfRangeException(nameof(role), "Self sign-up is limited to client and lawyer roles.");
        Phone = phone.Trim();
        Name = name.Trim();
        Role = role;
        Language = language;
    }

    public string Phone { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string? Email { get; private set; }
    public Guid? AvatarFileId { get; private set; }
    public string Language { get; private set; } = "uz-Latn";
    public UserRole Role { get; private set; } = UserRole.Client;
    public bool IsActive { get; private set; } = true;
    public bool IsBlocked { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }
    public bool IsDeleted => DeletedAt is not null;

    /// <summary>Whether the account may sign in or refresh a session.</summary>
    public bool CanAuthenticate => IsActive && !IsBlocked && !IsDeleted;

    public void UpdateProfile(string name, string language)
    {
        Name = name.Trim();
        Language = language;
        Touch();
    }

    public void Rename(string name) { Name = name.Trim(); Touch(); }
    public void ChangeEmail(string? email) { Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant(); Touch(); }
    public void ChangeLanguage(string language) { Language = language; Touch(); }
    public void SetAvatar(Guid fileId) { AvatarFileId = fileId; Touch(); }

    /// <summary>
    /// Deletes the account by removing personal data in place. The row stays so that
    /// audit records and foreign keys remain valid; the phone number becomes free again.
    /// </summary>
    public void Delete(DateTimeOffset now)
    {
        if (IsDeleted) return;
        Phone = $"deleted:{Id:N}";
        Name = DeletedName;
        Email = null;
        AvatarFileId = null;
        IsActive = false;
        DeletedAt = now;
        Touch();
    }
}
